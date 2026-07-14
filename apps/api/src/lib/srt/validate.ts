export interface SrtSegmentInput {
  start: number; // seconds
  end: number;
  text: string;
}

export interface ValidationIssue {
  index: number; 
  message: string;
}

export function validateSegments(segments: SrtSegmentInput[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  segments.forEach((segment, index) => {
    if (segment.start < 0) {
      issues.push({
        index,
        message: `Segment ${index + 1} has a negative start time (${segment.start}).`,
      });
    }
    if (segment.end < 0) {
      issues.push({
        index,
        message: `Segment ${index + 1} has a negative end time (${segment.end}).`,
      });
    }
    if (segment.start >= segment.end) {
      issues.push({
        index,
        message: `Segment ${index + 1} has start (${segment.start}) not before end (${segment.end}).`,
      });
    }

    const previous = segments[index - 1];
    if (previous && segment.start < previous.start) {
      issues.push({
        index,
        message: `Segment ${index + 1} starts before the previous segment - segments must be in chronological order.`,
      });
    }
  });

  return issues;
}