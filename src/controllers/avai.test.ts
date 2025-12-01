import mongoose from "mongoose";
import { AvailabilityTypeEnum, IAvailability } from "../models/availability";
import { _mergeOverlappedOccurrences } from "./availabilityController";

describe("Availability merge algorithm", () => {
  const sampleAvailability: IAvailability = {
    staff: mongoose.Types.ObjectId.createFromHexString("673861703400000000000000"),
    type: AvailabilityTypeEnum.AVAILABLE,
    from: 0,
    to: 100,
    isApproved: true,
    isDeleted: false,
    note: "test",
  };
  const segments = [
    { from: 200, to: 300 },
    { from: 400, to: 450 },
    { from: 500, to: 600 },
    { from: 700, to: 800 },
  ];

  const genRootAvailability = () => {
    return segments.map((segment) => ({
      ...sampleAvailability,
      from: segment.from,
      to: segment.to,
    }));
  };

  describe("add from empty array", () => {
    it("should add the new segment", () => {
      const newAvailability = { ...sampleAvailability, from: 850, to: 950 };
      const rootAvailability: IAvailability[] = [];
      const expectedSegments = [ { from: 850, to: 950 }];
      const expectedResult = expectedSegments.map((segment) => ({
        ...sampleAvailability,
        from: segment.from,
        to: segment.to,
      }));
      const mergedAvailabilities = _mergeOverlappedOccurrences(rootAvailability, newAvailability);
      expect(mergedAvailabilities).toStrictEqual(expectedResult);
    });
  });

  describe("no overlap - should add new segment in the correct position", () => {
    it("at the end", () => {
      const newAvailability = { ...sampleAvailability, from: 850, to: 950 };
      const rootAvailability = genRootAvailability();
      const expectedSegments = [...segments, { from: 850, to: 950 }];
      const expectedResult = expectedSegments.map((segment) => ({
        ...sampleAvailability,
        from: segment.from,
        to: segment.to,
      }));

      const mergedAvailabilities = _mergeOverlappedOccurrences(rootAvailability, newAvailability);
      expect(mergedAvailabilities).toStrictEqual(expectedResult);
    });

    it("at the start", () => {
      const newAvailability = { ...sampleAvailability, from: 0, to: 100 };
      const rootAvailability = genRootAvailability();
      const expectedSegments = [{ from: 0, to: 100 }, ...segments];
      const expectedResult = expectedSegments.map((segment) => ({
        ...sampleAvailability,
        from: segment.from,
        to: segment.to,
      }));

      const mergedAvailabilities = _mergeOverlappedOccurrences(rootAvailability, newAvailability);
      expect(mergedAvailabilities).toStrictEqual(expectedResult);
    });

    it("in the middle", () => {
      const newAvailability = { ...sampleAvailability, from: 325, to: 375 };
      const rootAvailability = genRootAvailability();
      const expectedSegments = [
        { from: 200, to: 300 },
        { from: 325, to: 375 },
        { from: 400, to: 450 },
        { from: 500, to: 600 },
        { from: 700, to: 800 },
      ];
      const expectedResult = expectedSegments.map((segment) => ({
        ...sampleAvailability,
        from: segment.from,
        to: segment.to,
      }));

      const mergedAvailabilities = _mergeOverlappedOccurrences(rootAvailability, newAvailability);
      expect(mergedAvailabilities).toStrictEqual(expectedResult);
    });
  });

  describe("overlap - should merge the overlapping segments", () => {
    it("overlap at the end", () => {
      const newAvailability = { ...sampleAvailability, from: 750, to: 850 };
      const rootAvailability = genRootAvailability();
      const expectedSegments = [
        { from: 200, to: 300 },
        { from: 400, to: 450 },
        { from: 500, to: 600 },
        { from: 700, to: 850 },
      ];
      const expectedResult = expectedSegments.map((segment) => ({
        ...sampleAvailability,
        from: segment.from,
        to: segment.to,
      }));
      const mergedAvailabilities = _mergeOverlappedOccurrences(rootAvailability, newAvailability);
      expect(mergedAvailabilities).toStrictEqual(expectedResult);
    });

    it("swallow 1 ends", () => {
      const newAvailability = { ...sampleAvailability, from: 650, to: 850 };
      const rootAvailability = genRootAvailability();
      const expectedSegments = [
        { from: 200, to: 300 },
        { from: 400, to: 450 },
        { from: 500, to: 600 },
        { from: 650, to: 850 },
      ];
      const expectedResult = expectedSegments.map((segment) => ({
        ...sampleAvailability,
        from: segment.from,
        to: segment.to,
      }));
      const mergedAvailabilities = _mergeOverlappedOccurrences(rootAvailability, newAvailability);
      expect(mergedAvailabilities).toStrictEqual(expectedResult);
    });

    it("partially swallow 2 ends", () => {
      const newAvailability = { ...sampleAvailability, from: 550, to: 850 };
      const rootAvailability = genRootAvailability();
      const expectedSegments = [
        { from: 200, to: 300 },
        { from: 400, to: 450 },
        { from: 500, to: 850 },
      ];
      const expectedResult = expectedSegments.map((segment) => ({
        ...sampleAvailability,
        from: segment.from,
        to: segment.to,
      }));
      const mergedAvailabilities = _mergeOverlappedOccurrences(rootAvailability, newAvailability);
      expect(mergedAvailabilities).toStrictEqual(expectedResult);
    });

    it("fully swallow 2 ends", () => {
      const newAvailability = { ...sampleAvailability, from: 475, to: 850 };
      const rootAvailability = genRootAvailability();
      const expectedSegments = [
        { from: 200, to: 300 },
        { from: 400, to: 450 },
        { from: 475, to: 850 },
      ];
      const expectedResult = expectedSegments.map((segment) => ({
        ...sampleAvailability,
        from: segment.from,
        to: segment.to,
      }));
      const mergedAvailabilities = _mergeOverlappedOccurrences(rootAvailability, newAvailability);
      expect(mergedAvailabilities).toStrictEqual(expectedResult);
    });

    it("swallow 3 ends in the nick of time", () => {
      const newAvailability = { ...sampleAvailability, from: 450, to: 850 };
      const rootAvailability = genRootAvailability();
      const expectedSegments = [
        { from: 200, to: 300 },
        { from: 400, to: 850 },
      ];
      const expectedResult = expectedSegments.map((segment) => ({
        ...sampleAvailability,
        from: segment.from,
        to: segment.to,
      }));
      const mergedAvailabilities = _mergeOverlappedOccurrences(rootAvailability, newAvailability);
      expect(mergedAvailabilities).toStrictEqual(expectedResult);
    });

    it("overlap at the middle", () => {
      const newAvailability = { ...sampleAvailability, from: 350, to: 420 };
      const rootAvailability = genRootAvailability();
      const expectedSegments = [
        { from: 200, to: 300 },
        { from: 350, to: 450 },
        { from: 500, to: 600 },
        { from: 700, to: 800 },
      ];
      const expectedResult = expectedSegments.map((segment) => ({
        ...sampleAvailability,
        from: segment.from,
        to: segment.to,
      }));
      const mergedAvailabilities = _mergeOverlappedOccurrences(rootAvailability, newAvailability);
      expect(mergedAvailabilities).toStrictEqual(expectedResult);
    });

    it("swallow 1 middle", () => {
      const newAvailability = { ...sampleAvailability, from: 475, to: 625 };
      const rootAvailability = genRootAvailability();
      const expectedSegments = [
        { from: 200, to: 300 },
        { from: 400, to: 450 },
        { from: 475, to: 625 },
        { from: 700, to: 800 },
      ];
      const expectedResult = expectedSegments.map((segment) => ({
        ...sampleAvailability,
        from: segment.from,
        to: segment.to,
      }));
      const mergedAvailabilities = _mergeOverlappedOccurrences(rootAvailability, newAvailability);
      expect(mergedAvailabilities).toStrictEqual(expectedResult);
    });

    it("overlap partially 2 middle", () => {
      const newAvailability = { ...sampleAvailability, from: 425, to: 625 };
      const rootAvailability = genRootAvailability();
      const expectedSegments = [
        { from: 200, to: 300 },
        { from: 400, to: 625 },
        { from: 700, to: 800 },
      ];
      const expectedResult = expectedSegments.map((segment) => ({
        ...sampleAvailability,
        from: segment.from,
        to: segment.to,
      }));
      const mergedAvailabilities = _mergeOverlappedOccurrences(rootAvailability, newAvailability);
      expect(mergedAvailabilities).toStrictEqual(expectedResult);
    });

    it("bride 2 middles", () => {
      const newAvailability = { ...sampleAvailability, from: 425, to: 525 };
      const rootAvailability = genRootAvailability();
      const expectedSegments = [
        { from: 200, to: 300 },
        { from: 400, to: 600 },
        { from: 700, to: 800 },
      ];
      const expectedResult = expectedSegments.map((segment) => ({
        ...sampleAvailability,
        from: segment.from,
        to: segment.to,
      }));
      const mergedAvailabilities = _mergeOverlappedOccurrences(rootAvailability, newAvailability);
      expect(mergedAvailabilities).toStrictEqual(expectedResult);
    });

    it("upper half overlap at the start", () => {
      const newAvailability = { ...sampleAvailability, from: 250, to: 350 };
      const rootAvailability = genRootAvailability();
      const expectedSegments = [
        { from: 200, to: 350 },
        { from: 400, to: 450 },
        { from: 500, to: 600 },
        { from: 700, to: 800 },
      ];
      const expectedResult = expectedSegments.map((segment) => ({
        ...sampleAvailability,
        from: segment.from,
        to: segment.to,
      }));
      const mergedAvailabilities = _mergeOverlappedOccurrences(rootAvailability, newAvailability);
      expect(mergedAvailabilities).toStrictEqual(expectedResult);
    });

    it("lower half overlap at the start", () => {
      const newAvailability = { ...sampleAvailability, from: 150, to: 250 };
      const rootAvailability = genRootAvailability();
      const expectedSegments = [
        { from: 150, to: 300 },
        { from: 400, to: 450 },
        { from: 500, to: 600 },
        { from: 700, to: 800 },
      ];
      const expectedResult = expectedSegments.map((segment) => ({
        ...sampleAvailability,
        from: segment.from,
        to: segment.to,
      }));
      const mergedAvailabilities = _mergeOverlappedOccurrences(rootAvailability, newAvailability);
      expect(mergedAvailabilities).toStrictEqual(expectedResult);
    });

    it("swallow 1 start", () => {
      const newAvailability = { ...sampleAvailability, from: 0, to: 350 };
      const rootAvailability = genRootAvailability();
      const expectedSegments = [
        { from: 0, to: 350 },
        { from: 400, to: 450 },
        { from: 500, to: 600 },
        { from: 700, to: 800 },
      ];
      const expectedResult = expectedSegments.map((segment) => ({
        ...sampleAvailability,
        from: segment.from,
        to: segment.to,
      }));
      const mergedAvailabilities = _mergeOverlappedOccurrences(rootAvailability, newAvailability);
      expect(mergedAvailabilities).toStrictEqual(expectedResult);
    });

    it("partially swallow 2 starts", () => {
      const newAvailability = { ...sampleAvailability, from: 0, to: 420 };
      const rootAvailability = genRootAvailability();
      const expectedSegments = [
        { from: 0, to: 450 },
        { from: 500, to: 600 },
        { from: 700, to: 800 },
      ];
      const expectedResult = expectedSegments.map((segment) => ({
        ...sampleAvailability,
        from: segment.from,
        to: segment.to,
      }));
      const mergedAvailabilities = _mergeOverlappedOccurrences(rootAvailability, newAvailability);
      expect(mergedAvailabilities).toStrictEqual(expectedResult);
    });

    it("fully swallow 2 starts", () => {
      const newAvailability = { ...sampleAvailability, from: 0, to: 475 };
      const rootAvailability = genRootAvailability();
      const expectedSegments = [
        { from: 0, to: 475 },
        { from: 500, to: 600 },
        { from: 700, to: 800 },
      ];
      const expectedResult = expectedSegments.map((segment) => ({
        ...sampleAvailability,
        from: segment.from,
        to: segment.to,
      }));
      const mergedAvailabilities = _mergeOverlappedOccurrences(rootAvailability, newAvailability);
      expect(mergedAvailabilities).toStrictEqual(expectedResult);
    });

    it("swallow 3 starts in the nick of time", () => {
      const newAvailability = { ...sampleAvailability, from: 0, to: 500 };
      const rootAvailability = genRootAvailability();
      const expectedSegments = [
        { from: 0, to: 600 },
        { from: 700, to: 800 },
      ];
      const expectedResult = expectedSegments.map((segment) => ({
        ...sampleAvailability,
        from: segment.from,
        to: segment.to,
      }));
      const mergedAvailabilities = _mergeOverlappedOccurrences(rootAvailability, newAvailability);
      expect(mergedAvailabilities).toStrictEqual(expectedResult);
    });
  });
});
