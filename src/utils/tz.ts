export function isValidTimeZone(timeZone: string) {
  try {
    // Attempt to create a DateTimeFormat instance with the provided time zone.
    // If the timeZone is invalid, this will throw a RangeError.
    Intl.DateTimeFormat(undefined, { timeZone: timeZone });
    return true;
  } catch (e) {
    // Catch the RangeError indicating an invalid time zone.
    if (e instanceof RangeError) {
      return false;
    }
    // Re-throw other types of errors if necessary.
    throw e;
  }
}
