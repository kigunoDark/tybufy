import { Skeleton } from '@mui/material';

const ScriptEditorSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Skeleton variant="text" width={200} height={20} />
          <span className="text-yellow-500">✨</span>
        </div>
        <div className="bg-slate-100 rounded-full px-4 py-2 text-sm text-slate-600">
          <Skeleton variant="text" width={180} height={20} />
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 bg-slate-50">
          <Skeleton variant="text" width="100%" height={20} />
          <Skeleton variant="text" width="80%" height={20} className="mt-2" />
          <Skeleton variant="text" width="70%" height={20} className="mt-2" />
          <Skeleton variant="text" width="90%" height={20} className="mt-2" />
        </div>

        <div className="absolute inset-y-0 right-0 w-1 bg-slate-200 rounded-r-lg">
          <div className="h-1/2 bg-slate-300 rounded-full animate-pulse"/>
        </div>
      </div>
    </div>
  );
};

export default ScriptEditorSkeleton;