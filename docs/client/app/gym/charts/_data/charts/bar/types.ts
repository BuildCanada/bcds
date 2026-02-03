export type SimpleBar = {
  background: string;
  foreground: string;
  fill: string;
};

export type Fill = {
  options: string[];
  default: string;
};

export type QualitativeBar = {
  background: string;
  foreground: string;
  fill: {
    "2": Fill;
    "3": Fill;
    "4": Fill;
    "5": Fill;
  };
};
