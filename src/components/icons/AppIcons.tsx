import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const baseProps: Partial<IconProps> = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 1.9,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
};

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <title>Arrow left</title>
      <path d="M20 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <title>Upload</title>
      <path d="M12 15V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  );
}

export function CompareIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <title>Compare</title>
      <path d="M12 4v16" />
      <path d="M4 5h8v14H4z" />
      <path d="M12 5h8v14h-8z" />
    </svg>
  );
}

export function ResetIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <title>Reset</title>
      <path d="M4 4v5h5" />
      <path d="M20 20v-5h-5" />
      <path d="M20 9a8 8 0 0 0-13.66-3.66L4 7" />
      <path d="M4 15a8 8 0 0 0 13.66 3.66L20 17" />
    </svg>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <title>Minus</title>
      <path d="M5 12h14" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <title>Plus</title>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <title>Play</title>
      <path d="m8 6 10 6-10 6z" />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <title>Pause</title>
      <path d="M9 6v12" />
      <path d="M15 6v12" />
    </svg>
  );
}

export function SpeedIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <title>Speed</title>
      <path d="M5 15a7 7 0 1 1 14 0" />
      <path d="m12 12 4-2" />
      <circle cx="12" cy="15" r="1.2" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <title>Clock</title>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <title>Layers</title>
      <path d="m12 3 9 5-9 5-9-5z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16 9 5 9-5" />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <title>Spark</title>
      <path d="M12 4v4" />
      <path d="M12 16v4" />
      <path d="M4 12h4" />
      <path d="M16 12h4" />
      <path d="m7 7 2.5 2.5" />
      <path d="m14.5 14.5 2.5 2.5" />
      <path d="m17 7-2.5 2.5" />
      <path d="M9.5 14.5 7 17" />
    </svg>
  );
}
