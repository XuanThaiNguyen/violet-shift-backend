import { TIME_RULES_DATA, TIME_RULES_IDS } from "../constants/salaryTimeRules";
import { TZDate } from "@date-fns/tz";
import { breakWorkLogIntoSegments, BaseTimeRule, TimeSegment, minutesToTime } from "./worklog";
import { WeekdaysEnum } from "../constants/weekdays";

const timeRules: BaseTimeRule[] = Object.keys(TIME_RULES_DATA).map((key) => {
  return {
    id: key,
    ...TIME_RULES_DATA[key],
  };
});

const timezone = "Australia/Sydney";

describe("breakWorkLogIntoSegments", () => {
  describe("Input validation", () => {
    it("should throw error when startTime is invalid", () => {
      const invalidDate = new Date("invalid") as any;
      const validDate = new TZDate(2024, 0, 1, 9, 0, timezone);

      expect(() => {
        breakWorkLogIntoSegments(invalidDate, validDate, timeRules);
      }).toThrow("Start time and end time must be valid dates");
    });

    it("should throw error when endTime is invalid", () => {
      const validDate = new TZDate(2024, 0, 1, 9, 0, timezone);
      const invalidDate = new Date("invalid") as any;

      expect(() => {
        breakWorkLogIntoSegments(validDate, invalidDate, timeRules);
      }).toThrow("Start time and end time must be valid dates");
    });

    it("should throw error when startTime is greater than endTime", () => {
      const startTime = new TZDate(2024, 0, 1, 17, 0, timezone);
      const endTime = new TZDate(2024, 0, 1, 9, 0, timezone);

      expect(() => {
        breakWorkLogIntoSegments(startTime, endTime, timeRules);
      }).toThrow("Start time is greater than end time");
    });
  });

  describe("Same day scenarios", () => {
    it("should break work log within same day (weekday, no holiday)", () => {
      // Monday, 2 PM to 10 PM
      const startTime = new TZDate(2024, 0, 1, 14, 0, timezone); // Monday Jan 1, 2024
      const endTime = new TZDate(2024, 0, 1, 22, 0, timezone);
      const ordinaryRule = TIME_RULES_DATA[TIME_RULES_IDS.ORDINARY];
      const [min, sec] = minutesToTime(ordinaryRule.toTime);
      const ordinaryEndTime = new TZDate(2024, 0, 1, min, sec, timezone);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules);

      expect(segments).toBeDefined();
      expect(Array.isArray(segments)).toBe(true);
      // Should have segments for ordinary time (9 AM to 5 PM = 8 hours)
      expect(segments.length).toEqual(2);
      segments.forEach((segment) => {
        expect(segment).toHaveProperty("ruleId");
        expect(segment).toHaveProperty("from");
        expect(segment).toHaveProperty("to");
        expect(segment).toHaveProperty("duration");
        expect(segment).toHaveProperty("timezone");
        expect(segment.duration).toBeGreaterThan(0);
      });

      const sortedSegments = segments.sort((a, b) => a.from - b.from);
      expect(sortedSegments[0].ruleId).toEqual(TIME_RULES_IDS.ORDINARY);
      expect(sortedSegments[0].to).toEqual(ordinaryEndTime.getTime()); // 8PM in sydney
      expect(sortedSegments[1].ruleId).toEqual(TIME_RULES_IDS.NIGHTLY);
      expect(sortedSegments[1].from).toEqual(ordinaryEndTime.getTime()); // 8PM in sydney
    });

    it("should handle holiday on same day", () => {
      const startTime = new TZDate(2024, 0, 1, 9, 0, timezone);
      const endTime = new TZDate(2024, 0, 1, 17, 0, timezone);
      const holiday = new TZDate(2024, 0, 1, 0, 0, timezone);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules, [holiday]);

      expect(segments).toBeDefined();
      expect(Array.isArray(segments)).toBe(true);
      // Should use holiday rules
      const hasHolidayRule = segments.some((s) => s.ruleId === TIME_RULES_IDS.HOLIDAY);
      expect(hasHolidayRule).toBe(true);
    });

    it("should handle Saturday work", () => {
      // Saturday, 9 AM to 5 PM
      const startTime = new TZDate(2024, 0, 6, 9, 0, timezone); // Saturday Jan 6, 2024
      const endTime = new TZDate(2024, 0, 6, 17, 0, timezone);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules);

      expect(segments).toBeDefined();
      expect(segments.length).toBeGreaterThan(0);
      // Should use Saturday rules
      const hasSaturdayRule = segments.some((s) => s.ruleId === TIME_RULES_IDS.SATURDAY);
      expect(hasSaturdayRule).toBe(true);
    });

    it("should handle Sunday work", () => {
      // Sunday, 9 AM to 5 PM
      const startTime = new TZDate(2024, 0, 7, 9, 0, timezone); // Sunday Jan 7, 2024
      const endTime = new TZDate(2024, 0, 7, 17, 0, timezone);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules);

      expect(segments).toBeDefined();
      expect(segments.length).toBeGreaterThan(0);
      // Should use Sunday rules
      const hasSundayRule = segments.some((s) => s.ruleId === TIME_RULES_IDS.SUNDAY);
      expect(hasSundayRule).toBe(true);
    });
  });

  describe("Multi-day scenarios", () => {
    it("should break work log across two days", () => {
      // Monday 9 AM to Tuesday 5 PM
      const startTime = new TZDate(2024, 0, 1, 9, 0, timezone);
      const endTime = new TZDate(2024, 0, 2, 17, 0, timezone);
      const ordinaryEndTime = new TZDate(2024, 0, 1, 20, 0, timezone);
      const midnight = new TZDate(2024, 0, 2, 0, 0, timezone);
      const overnightEndTime = new TZDate(2024, 0, 2, 6, 0, timezone);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules);

      expect(segments).toBeDefined();
      expect(Array.isArray(segments)).toBe(true);
      expect(segments.length).toEqual(4);

      const sortedSegments = segments.sort((a, b) => a.from - b.from);
      expect(sortedSegments[0].ruleId).toEqual(TIME_RULES_IDS.ORDINARY);
      expect(sortedSegments[0].to).toEqual(ordinaryEndTime.getTime());
      expect(sortedSegments[1].ruleId).toEqual(TIME_RULES_IDS.NIGHTLY);
      expect(sortedSegments[1].to).toEqual(midnight.getTime());
      expect(sortedSegments[2].ruleId).toEqual(TIME_RULES_IDS.OVERNIGHT);
      expect(sortedSegments[2].to).toEqual(overnightEndTime.getTime());
      expect(sortedSegments[3].ruleId).toEqual(TIME_RULES_IDS.ORDINARY);
      expect(sortedSegments[3].to).toEqual(endTime.getTime());
    });

    it("should break work log across three days", () => {
      // Monday 9 AM to Wednesday 5 PM
      const startTime = new TZDate(2024, 0, 1, 9, 0, timezone);
      const endTime = new TZDate(2024, 0, 3, 17, 0, timezone);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules);

      expect(segments).toBeDefined();
      expect(segments.length).toBeGreaterThan(0);

      // Should have segments for each day
      const uniqueDays = new Set(segments.map((s) => new Date(s.from).toDateString()));
      expect(uniqueDays.size).toBeGreaterThanOrEqual(2);
    });

    it("should handle holidays in multi-day period", () => {
      const startTime = new TZDate(2024, 0, 1, 9, 0, timezone);
      const endTime = new TZDate(2024, 0, 3, 17, 0, timezone);
      const holiday = new TZDate(2024, 0, 2, 12, 0, timezone); // Tuesday holiday

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules, [holiday]);

      expect(segments).toBeDefined();
      expect(segments.length).toBeGreaterThan(0);

      // Should have holiday rule segments for the holiday day
      const holidaySegments = segments.filter((s) => s.ruleId === TIME_RULES_IDS.HOLIDAY);
      expect(holidaySegments.length).toBeGreaterThan(0);
    });

    it("should handle multiple holidays in multi-day period", () => {
      const startTime = new TZDate(2024, 0, 1, 9, 0, timezone);
      const endTime = new TZDate(2024, 0, 5, 17, 0, timezone);
      const holiday1 = new TZDate(2024, 0, 2, 12, 0, timezone);
      const holiday2 = new TZDate(2024, 0, 4, 12, 0, timezone);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules, [
        holiday1,
        holiday2,
      ]);

      expect(segments).toBeDefined();
      expect(segments.length).toBeGreaterThan(0);

      const holidaySegments = segments.filter((s) => s.ruleId === TIME_RULES_IDS.HOLIDAY);
      expect(holidaySegments.length).toBeGreaterThan(0);
    });
  });

  describe("Edge cases", () => {
    it("should handle work log spanning midnight", () => {
      // Monday 11 PM to Tuesday 1 AM
      const startTime = new TZDate(2024, 0, 1, 23, 0, timezone);
      const endTime = new TZDate(2024, 0, 2, 1, 0, timezone);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules);

      expect(segments).toBeDefined();
      expect(segments.length).toBeGreaterThan(0);

      // Should have segments for both days
      const uniqueDays = new Set(segments.map((s) => new TZDate(s.from, timezone).toDateString()));
      expect(uniqueDays.size).toBe(2);
    });

    it("should handle work log starting at midnight", () => {
      const startTime = new TZDate(2024, 0, 1, 0, 0, timezone);
      const endTime = new TZDate(2024, 0, 1, 8, 0, timezone);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules);

      expect(segments).toBeDefined();
      expect(segments.length).toBeGreaterThan(0);
    });

    it("should handle work log ending at midnight", () => {
      const startTime = new TZDate(2024, 0, 1, 16, 0, timezone);
      const endTime = new TZDate(2024, 0, 1, 23, 59, timezone);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules);

      expect(segments).toBeDefined();
      expect(segments.length).toBeGreaterThan(0);
    });

    it("should handle empty time rules array", () => {
      const startTime = new TZDate(2024, 0, 1, 9, 0, timezone);
      const endTime = new TZDate(2024, 0, 1, 17, 0, timezone);

      const segments = breakWorkLogIntoSegments(startTime, endTime, []);

      expect(segments).toBeDefined();
      expect(segments).toEqual([]);
    });

    it("should handle work log with only overnight rules matching", () => {
      const overnightRule: BaseTimeRule[] = [
        {
          id: "overnight-only",
          fromTime: 0,
          toTime: 359,
          weekdays: WeekdaysEnum.WEEKDAYS,
        },
      ];

      // 2 AM to 4 AM
      const startTime = new TZDate(2024, 0, 1, 2, 0, timezone);
      const endTime = new TZDate(2024, 0, 1, 4, 0, timezone);

      const segments = breakWorkLogIntoSegments(startTime, endTime, overnightRule);

      expect(segments).toBeDefined();
      expect(segments.length).toBeGreaterThan(0);
      expect(segments[0].ruleId).toBe("overnight-only");
    });

    it("should handle work log spanning weekend", () => {
      // Friday 9 AM to Monday 5 PM
      const startTime = new TZDate(2024, 0, 5, 9, 0, timezone); // Friday
      const endTime = new TZDate(2024, 0, 8, 17, 0, timezone); // Monday

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules);

      expect(segments).toBeDefined();
      expect(segments.length).toBeGreaterThan(0);

      // Should have Saturday and Sunday rules
      const hasSaturdayRule = segments.some((s) => s.ruleId === TIME_RULES_IDS.SATURDAY);
      const hasSundayRule = segments.some((s) => s.ruleId === TIME_RULES_IDS.SUNDAY);
      expect(hasSaturdayRule || hasSundayRule).toBe(true);
    });
  });

  describe("Segment properties", () => {
    it("should return segments with correct structure", () => {
      const startTime = new TZDate(2024, 0, 1, 9, 0, timezone);
      const endTime = new TZDate(2024, 0, 1, 17, 0, timezone);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules);

      segments.forEach((segment) => {
        expect(segment).toHaveProperty("ruleId");
        expect(segment).toHaveProperty("from");
        expect(segment).toHaveProperty("to");
        expect(segment).toHaveProperty("duration");
        expect(segment).toHaveProperty("timezone");

        expect(typeof segment.ruleId).toBe("string");
        expect(typeof segment.from).toBe("number");
        expect(typeof segment.to).toBe("number");
        expect(typeof segment.duration).toBe("number");
        expect(typeof segment.timezone).toBe("string");

        expect(segment.from).toBeLessThanOrEqual(segment.to);
        expect(segment.duration).toBe(segment.to - segment.from);
      });
    });

    it("should return segments sorted by time", () => {
      const startTime = new TZDate(2024, 0, 1, 9, 0, timezone);
      const endTime = new TZDate(2024, 0, 3, 17, 0, timezone);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules);

      for (let i = 1; i < segments.length; i++) {
        expect(segments[i].from).toBeGreaterThanOrEqual(segments[i - 1].from);
      }
    });
  });

  describe("Timezone-sensitive scenarios", () => {
    // Helper function to create expected result template
    const createExpectedSegmentTemplate = (
      ruleId: string,
      fromDate: TZDate,
      toDate: TZDate,
      timezone: string,
    ): TimeSegment => {
      return {
        ruleId,
        from: fromDate.getTime(),
        to: toDate.getTime(),
        duration: toDate.getTime() - fromDate.getTime(),
        timezone,
      };
    };

    // Helper to format expected results for comparison
    const formatSegmentForComparison = (segment: TimeSegment) => {
      return {
        ruleId: segment.ruleId,
        from: new Date(segment.from).toISOString(),
        to: new Date(segment.to).toISOString(),
        duration: segment.duration,
        timezone: segment.timezone,
      };
    };

    it("should handle Sydney timezone (AEDT/AEST)", () => {
      const sydneyTz = "Australia/Sydney";
      // Monday 9 AM to 5 PM in Sydney
      const startTime = new TZDate(2024, 0, 1, 9, 0, sydneyTz);
      const endTime = new TZDate(2024, 0, 1, 17, 0, sydneyTz);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules);

      // Expected template: Should have ordinary time rule segments
      const expectedTemplate = [
        createExpectedSegmentTemplate(
          TIME_RULES_IDS.ORDINARY,
          new TZDate(2024, 0, 1, 9, 0, sydneyTz),
          new TZDate(2024, 0, 1, 17, 0, sydneyTz),
          sydneyTz,
        ),
      ];

      expect(segments.length).toBeGreaterThan(0);
      expect(segments[0].timezone).toBe(sydneyTz);

      // Verify all segments use Sydney timezone
      segments.forEach((segment) => {
        expect(segment.timezone).toBe(sydneyTz);
      });

      // Log for manual comparison
      // console.log("Sydney segments:", segments.map(formatSegmentForComparison));
    });

    it("should handle Melbourne timezone (AEDT/AEST)", () => {
      const melbourneTz = "Australia/Melbourne";
      // Monday 9 AM to 5 PM in Melbourne
      const startTime = new TZDate(2024, 0, 1, 9, 0, melbourneTz);
      const endTime = new TZDate(2024, 0, 1, 17, 0, melbourneTz);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules);

      expect(segments.length).toBeGreaterThan(0);
      expect(segments[0].timezone).toBe(melbourneTz);

      segments.forEach((segment) => {
        expect(segment.timezone).toBe(melbourneTz);
      });

      // console.log("Melbourne segments:", segments.map(formatSegmentForComparison));
    });

    it("should handle Brisbane timezone (AEST - no DST)", () => {
      const brisbaneTz = "Australia/Brisbane";
      // Monday 9 AM to 5 PM in Brisbane
      const startTime = new TZDate(2024, 0, 1, 9, 0, brisbaneTz);
      const endTime = new TZDate(2024, 0, 1, 17, 0, brisbaneTz);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules);

      expect(segments.length).toBeGreaterThan(0);
      expect(segments[0].timezone).toBe(brisbaneTz);

      segments.forEach((segment) => {
        expect(segment.timezone).toBe(brisbaneTz);
      });

      // console.log("Brisbane segments:", segments.map(formatSegmentForComparison));
    });

    it("should handle Perth timezone (AWST - UTC+8)", () => {
      const perthTz = "Australia/Perth";
      // Monday 9 AM to 5 PM in Perth
      const startTime = new TZDate(2024, 0, 1, 9, 0, perthTz);
      const endTime = new TZDate(2024, 0, 1, 17, 0, perthTz);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules);

      expect(segments.length).toBeGreaterThan(0);
      expect(segments[0].timezone).toBe(perthTz);

      segments.forEach((segment) => {
        expect(segment.timezone).toBe(perthTz);
      });

      // console.log("Perth segments:", segments.map(formatSegmentForComparison));
    });

    it("should handle Adelaide timezone (ACDT/ACST)", () => {
      const adelaideTz = "Australia/Adelaide";
      // Monday 9 AM to 5 PM in Adelaide
      const startTime = new TZDate(2024, 0, 1, 9, 0, adelaideTz);
      const endTime = new TZDate(2024, 0, 1, 17, 0, adelaideTz);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules);

      expect(segments.length).toBeGreaterThan(0);
      expect(segments[0].timezone).toBe(adelaideTz);

      segments.forEach((segment) => {
        expect(segment.timezone).toBe(adelaideTz);
      });

      // console.log("Adelaide segments:", segments.map(formatSegmentForComparison));
    });

    it("should handle Darwin timezone (ACST - UTC+9:30, no DST)", () => {
      const darwinTz = "Australia/Darwin";
      // Monday 9 AM to 5 PM in Darwin
      const startTime = new TZDate(2024, 0, 1, 9, 0, darwinTz);
      const endTime = new TZDate(2024, 0, 1, 17, 0, darwinTz);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules);

      expect(segments.length).toBeGreaterThan(0);
      expect(segments[0].timezone).toBe(darwinTz);

      segments.forEach((segment) => {
        expect(segment.timezone).toBe(darwinTz);
      });

      // console.log("Darwin segments:", segments.map(formatSegmentForComparison));
    });

    it("should correctly handle timezone differences - same UTC time, different local times", () => {
      // Same UTC moment, but different local times
      const utcStartTime = new Date("2024-01-01T14:00:00Z"); // 2 PM UTC
      const utcEndTime = new Date("2024-01-01T18:00:00Z"); // 6 PM UTC

      const sydneyTimezone = "Australia/Sydney";
      const perthTimezone = "Australia/Perth";

      const sydneyStart = new TZDate(utcStartTime.getTime(), sydneyTimezone); // 1 AM Tuesday Sydney
      const sydneyEnd = new TZDate(utcEndTime.getTime(), sydneyTimezone); // 5 AM Tuesday Sydney

      const perthStart = new TZDate(utcStartTime.getTime(), perthTimezone); // 10 PM Monday Perth
      const perthEnd = new TZDate(utcEndTime.getTime(), perthTimezone); // 2 AM Tuesday Perth

      const sydneySegments = breakWorkLogIntoSegments(sydneyStart, sydneyEnd, timeRules);
      const perthSegments = breakWorkLogIntoSegments(perthStart, perthEnd, timeRules);

      // Both should produce segments, but with different timezone contexts
      expect(sydneySegments.length).toBeGreaterThan(0);
      expect(perthSegments.length).toBeGreaterThan(0);
      expect(perthSegments.length).toBeGreaterThan(sydneySegments.length);

      expect(sydneySegments[0].timezone).toBe("Australia/Sydney");
      expect(perthSegments[0].timezone).toBe("Australia/Perth");

      // The segments should reflect the local time context
      const SydneySegmentDays = new Set(
        sydneySegments.map((s) => new TZDate(s.from, sydneyTimezone).toDateString()),
      );
      const PerthSegmentDays = new Set(
        perthSegments.map((s) => new TZDate(s.from, perthTimezone).toDateString()),
      );

      expect(SydneySegmentDays.size).toBe(1);
      expect(PerthSegmentDays.size).toBe(2);

      // console.log("Sydney (9-11 PM):", sydneySegments.map(formatSegmentForComparison));
      // console.log("Perth (6-8 PM):", perthSegments.map(formatSegmentForComparison));
    });

    it("should handle work log spanning midnight with timezone awareness", () => {
      const sydneyTz = "Australia/Sydney";
      // Monday 11 PM to Tuesday 1 AM in Sydney
      const startTime = new TZDate(2024, 0, 1, 23, 0, sydneyTz);
      const endTime = new TZDate(2024, 0, 2, 1, 0, sydneyTz);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules);

      expect(segments.length).toBeGreaterThan(0);

      // Should have segments for both days
      const mondaySegments = segments.filter((s) => {
        const date = new TZDate(s.from, sydneyTz);
        return date.getDate() === 1;
      });
      const tuesdaySegments = segments.filter((s) => {
        const date = new TZDate(s.from, sydneyTz);
        return date.getDate() === 2;
      });

      expect(mondaySegments.length).toBeGreaterThan(0);
      expect(tuesdaySegments.length).toBeGreaterThan(0);

      // All segments should use Sydney timezone
      segments.forEach((segment) => {
        expect(segment.timezone).toBe(sydneyTz);
      });

      // console.log("Sydney midnight-spanning segments:", segments.map(formatSegmentForComparison));
    });

    it("should handle multi-day work log with timezone consistency", () => {
      const melbourneTz = "Australia/Melbourne";
      // Monday 9 AM to Wednesday 5 PM in Melbourne
      const startTime = new TZDate(2024, 0, 1, 9, 0, melbourneTz);
      const endTime = new TZDate(2024, 0, 3, 17, 0, melbourneTz);

      const segments = breakWorkLogIntoSegments(startTime, endTime, timeRules);

      expect(segments.length).toBeGreaterThan(0);

      // All segments should use the same timezone
      segments.forEach((segment) => {
        expect(segment.timezone).toBe(melbourneTz);
      });

      // Expected template structure
      const expectedStructure = {
        totalSegments: segments.length,
        timezone: melbourneTz,
        days: 3,
        segments: segments.map((s) => ({
          ruleId: s.ruleId,
          date: new Date(s.from).toISOString().split("T")[0],
          from: new Date(s.from).toISOString(),
          to: new Date(s.to).toISOString(),
          duration: s.duration,
        })),
      };

      // console.log("Melbourne multi-day structure:", JSON.stringify(expectedStructure, null, 2));
    });
  });
});
