import { SparkIcon } from '../icons/AppIcons';

interface ViewerNoticeProps {
  notice: string;
}

export function ViewerNotice({ notice }: ViewerNoticeProps) {
  return (
    <p className="ui-notice-warning mx-auto inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs">
      <SparkIcon className="h-4 w-4" />
      {notice}
    </p>
  );
}
