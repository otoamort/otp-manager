import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
// import { URL, URLSearchParams } from 'url'; // Use node's built-in URL module if in Node.js
// If in a browser environment, these are globally available, no import needed.

/**
 * Defines the structure for known OTPAuth parameters.
 * Allows for additional unknown parameters via index signature.
 */
export interface OtpAuthParameters {
  secret: string; // Base32 encoded secret key (required)
  issuer?: string; // Identifies the provider or service (recommended)
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512' | string; // Algorithm (default: SHA1)
  digits?: 6 | 8 | number; // Number of digits in the OTP (default: 6)
  counter?: number; // Initial counter value (required for hotp)
  period?: number; // Time step duration in seconds (default: 30 for totp)
  // Index signature to allow any other parameters present in the URI
  [key: string]: string | number | undefined;
}

/**
 * Defines the structure for the parsed label component.
 */
export interface OtpAuthLabel {
  issuer: string | null; // Issuer name parsed from the label prefix (e.g., "Example" in "Example:user@site.com")
  account: string;       // Account name parsed from the label (e.g., "user@site.com")
}

/**
 * Defines the overall structure of the parsed OTPAuth URI data.
 */
export interface OtpAuthData {
  type: 'totp' | 'hotp';      // OTP type
  label: OtpAuthLabel;        // Parsed label information
  parameters: OtpAuthParameters; // Parsed query parameters
}

/**
 * Parses an otpauth:// URI string into a structured OtpAuthData object.
 *
 * @param uriString The otpauth:// URI string to parse.
 * @returns An OtpAuthData object containing the parsed data, or null if parsing fails
 *          due to invalid format or missing required parameters.
 */
export function parseOtpAuthUri(uriString: string): OtpAuthData | null {
  console.log("Parsing URI:", uriString);
  if (typeof uriString !== 'string' || !uriString.startsWith('otpauth://')) {
    console.error("Invalid URI: Does not start with otpauth://");
    return null;
  }

  try {
    const url = new URL(uriString);

    // 1. Extract Type (totp or hotp)
    const type = url.hostname.toLowerCase();
    if (type !== 'totp' && type !== 'hotp') {
      console.error(`Invalid URI: Unknown type "${url.hostname}". Expected 'totp' or 'hotp'.`);
      return null;
    }
    // After this check, TypeScript knows 'type' is 'totp' | 'hotp'

    // 2. Extract and Decode Label
    // Pathname includes the leading '/', remove it.
    const encodedPath = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
    if (!encodedPath) {
        console.error("Invalid URI: Label cannot be empty.");
        return null;
    }
    const decodedLabelStr = decodeURIComponent(encodedPath);


    // 3. Parse Label into Issuer and Account
    let labelIssuer: string | null = null;
    let labelAccount: string = decodedLabelStr; // Default to full label

    const firstColonIndex = decodedLabelStr.indexOf(':');
    if (firstColonIndex > 0 && firstColonIndex < decodedLabelStr.length - 1) { // Ensure colon isn't first or last char
      labelIssuer = decodedLabelStr.substring(0, firstColonIndex).trim();
      labelAccount = decodedLabelStr.substring(firstColonIndex + 1).trim();
       // Handle cases like "Example%3Auser@example.com" if decodeURIComponent didn't fully resolve it (less common)
       const encodedColon = '%3A';
       if (labelAccount.startsWith(encodedColon)) {
           labelAccount = decodeURIComponent(labelAccount);
       }
       if (labelIssuer.endsWith(encodedColon.substring(0,2)) && labelAccount.startsWith(encodedColon.substring(2))) {
           labelIssuer = decodeURIComponent(labelIssuer);
           labelAccount = decodeURIComponent(labelAccount);
       }
    }
    // Ensure account part is not empty after potential split
     if (!labelAccount) {
        console.error("Invalid URI: Account name part of the label cannot be empty after parsing.");
        return null;
     }


    // 4. Extract Parameters
    // Use Partial to allow building the object gradually, add index signature for extras
    const params: Partial<OtpAuthParameters> & { [key: string]: string | number | undefined } = {};

    for (const [key, value] of url.searchParams.entries()) {
      const lowerKey = key.toLowerCase();
      const decodedValue = decodeURIComponent(value); // Ensure value is decoded

      switch (lowerKey) {
        case 'secret':
          params.secret = decodedValue;
          break;
        case 'issuer':
          params.issuer = decodedValue;
          break;
        case 'algorithm':
           // Basic validation for known types, but allow others as string
           const upperAlg = decodedValue.toUpperCase();
           if (upperAlg === 'SHA1' || upperAlg === 'SHA256' || upperAlg === 'SHA512') {
              params.algorithm = upperAlg;
           } else {
              console.warn(`Warning: Unknown algorithm specified: "${decodedValue}". Storing as provided.`);
              params.algorithm = decodedValue; // Store potentially unknown algorithm
           }
          break;
        case 'digits':
          const digits = parseInt(decodedValue, 10);
          if (!isNaN(digits) && (digits === 6 || digits === 8)) { // Common values
            params.digits = digits;
          } else if (!isNaN(digits) && digits > 0) {
             console.warn(`Warning: Unusual number of digits specified: ${digits}. Standard is 6 or 8.`);
             params.digits = digits; // Store valid but unusual number
          } else {
            console.warn(`Warning: Invalid value for 'digits' parameter: "${decodedValue}". Ignoring.`);
          }
          break;
        case 'period':
          const period = parseInt(decodedValue, 10);
          if (!isNaN(period) && period > 0) {
            params.period = period;
          } else {
            console.warn(`Warning: Invalid value for 'period' parameter: "${decodedValue}". Ignoring.`);
          }
          break;
        case 'counter':
          const counter = parseInt(decodedValue, 10);
          // Allow counter 0 or greater
          if (!isNaN(counter) && counter >= 0) {
            params.counter = counter;
          } else {
            console.warn(`Warning: Invalid value for 'counter' parameter: "${decodedValue}". Ignoring.`);
          }
          break;
        default:
          // Store any other parameters found
          console.log(`Info: Storing unknown parameter "${lowerKey}"`);
          params[lowerKey] = decodedValue;
          break;
      }
    }

    // 5. Validate Required Parameters
    if (typeof params.secret !== 'string' || params.secret.length === 0) {
      console.error("Invalid URI: Missing or empty 'secret' parameter.");
      return null;
    }
    if (type === 'hotp' && typeof params.counter !== 'number') {
      console.error("Invalid URI: Missing or invalid 'counter' parameter, which is required for type 'hotp'.");
      return null;
    }

    // 6. Consolidate Issuer (parameter takes precedence)
    const finalIssuer = params.issuer || labelIssuer;
     // Update params.issuer if it wasn't set but labelIssuer exists
     // Note: If both exist, params.issuer already won.
     if (finalIssuer && typeof params.issuer === 'undefined') {
        params.issuer = finalIssuer;
     }

    // 7. Construct final result object - Cast params to OtpAuthParameters after validation
    const result: OtpAuthData = {
      type: type,
      label: {
        issuer: labelIssuer, // Keep the original label issuer distinct
        account: labelAccount,
      },
      // We've validated the required fields, so this cast is reasonable.
      // The interface allows extra properties via the index signature.
      parameters: params as OtpAuthParameters,
    };

    return result;

  } catch (e) {
    // Catch errors from new URL() or decodeURIComponent()
    if (e instanceof Error) {
        console.error(`Error parsing URI: ${e.message}`);
    } else {
        console.error("An unknown error occurred during URI parsing.");
    }
    return null;
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
