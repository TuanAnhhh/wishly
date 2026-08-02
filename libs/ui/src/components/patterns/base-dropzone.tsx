import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useMemo,
  useReducer,
  useState,
} from 'react';
import {
  type Accept,
  type FileRejection,
  useDropzone as rootUseBaseDropzone,
} from 'react-dropzone';

import { cn } from '../../lib/utils';
import { Button, type ButtonProps } from '../ui/button';

type BaseDropzoneResult<TUploadRes, TUploadError> =
  | {
      status: "pending";
    }
  | {
      status: "error";
      error: TUploadError;
    }
  | {
      status: "success";
      result: TUploadRes;
    };

export type FileStatus<TUploadRes, TUploadError> = {
  id: string;
  fileName: string;
  file: File;
  tries: number;
} & (
  | {
      status: "pending";
      result?: undefined;
      error?: undefined;
    }
  | {
      status: "error";
      error: TUploadError;
      result?: undefined;
    }
  | {
      status: "success";
      result: TUploadRes;
      error?: undefined;
    }
);

const fileStatusReducer = <TUploadRes, TUploadError>(
  state: FileStatus<TUploadRes, TUploadError>[],
  action:
    | {
        type: "add";
        id: string;
        fileName: string;
        file: File;
      }
    | {
        type: "remove";
        id: string;
      }
    | ({
        type: "update-status";
        id: string;
      } & BaseDropzoneResult<TUploadRes, TUploadError>),
): FileStatus<TUploadRes, TUploadError>[] => {
  switch (action.type) {
    case "add":
      return [
        ...state,
        {
          id: action.id,
          fileName: action.fileName,
          file: action.file,
          status: "pending",
          tries: 1,
        },
      ];
    case "remove":
      return state.filter((fileStatus) => fileStatus.id !== action.id);
    case "update-status":
      return state.map((fileStatus) => {
        if (fileStatus.id === action.id) {
          const { id: _id, type: _type, ...rest } = action;
          void _id;
          void _type;
          return {
            ...fileStatus,
            ...rest,
            tries:
              action.status === "pending"
                ? fileStatus.tries + 1
                : fileStatus.tries,
          } as FileStatus<TUploadRes, TUploadError>;
        }
        return fileStatus;
      });
  }
};
type DropZoneErrorCode = (typeof dropZoneErrorCodes)[number];
const dropZoneErrorCodes = [
  "file-invalid-type",
  "file-too-large",
  "file-too-small",
  "too-many-files",
] as const;

const getDropZoneErrorCodes = (fileRejections: FileRejection[]) => {
  const errors = fileRejections.map((rejection) => {
    return rejection.errors
      .filter((error) =>
        dropZoneErrorCodes.includes(error.code as DropZoneErrorCode),
      )
      .map((error) => error.code) as DropZoneErrorCode[];
  });
  return Array.from(new Set(errors.flat()));
};

const getRootError = (
  errorCodes: DropZoneErrorCode[],
  limits: {
    accept?: Accept;
    maxSize?: number;
    minSize?: number;
    maxFiles?: number;
  },
) => {
  const errors = errorCodes.map((error) => {
    switch (error) {
      case 'file-invalid-type': {
        const acceptedTypes = Object.values(limits.accept ?? {})
          .flat()
          .join(', ');
        return acceptedTypes
          ? `Chỉ chấp nhận ${acceptedTypes}`
          : 'Định dạng tệp không hợp lệ';
      }
      case 'file-too-large': {
        const maxMb = limits.maxSize
          ? (limits.maxSize / (1024 * 1024)).toFixed(2)
          : '?';
        return `Tối đa ${maxMb}MB`;
      }
      case 'file-too-small': {
        const roundedMinSize = limits.minSize
          ? (limits.minSize / (1024 * 1024)).toFixed(2)
          : '?';
        return `Tối thiểu ${roundedMinSize}MB`;
      }
      case 'too-many-files':
        return `Tối đa ${limits.maxFiles} tệp`;
      default:
        return 'Tệp không hợp lệ';
    }
  });
  return errors.join('; ');
};

type UseBaseDropzoneProps<TUploadRes, TUploadError> = {
  onDropFile: (
    file: File,
  ) => Promise<
    Exclude<BaseDropzoneResult<TUploadRes, TUploadError>, { status: "pending" }>
  >;
  onRemoveFile?: (id: string) => void | Promise<void>;
  onFileUploaded?: (result: TUploadRes) => void;
  onFileUploadError?: (error: TUploadError) => void;
  onAllUploaded?: () => void;
  onRootError?: (error: string | undefined) => void;
  maxRetryCount?: number;
  autoRetry?: boolean;
  validation?: {
    accept?: Accept;
    minSize?: number;
    maxSize?: number;
    maxFiles?: number;
  };
  shiftOnMaxFiles?: boolean;
} & (TUploadError extends string
  ? {
      shapeUploadError?: (error: TUploadError) => string | void;
    }
  : {
      shapeUploadError: (error: TUploadError) => string | void;
    });

interface UseBaseDropzoneReturn<TUploadRes, TUploadError> {
  getRootProps: ReturnType<typeof rootUseBaseDropzone>["getRootProps"];
  getInputProps: ReturnType<typeof rootUseBaseDropzone>["getInputProps"];
  onRemoveFile: (id: string) => Promise<void>;
  onRetry: (id: string) => Promise<void>;
  canRetry: (id: string) => boolean;
  fileStatuses: FileStatus<TUploadRes, TUploadError>[];
  isInvalid: boolean;
  isDragActive: boolean;
  rootError: string | undefined;
  inputId: string;
  rootMessageId: string;
  rootDescriptionId: string;
  getFileMessageId: (id: string) => string;
}

const useBaseDropzone = <TUploadRes, TUploadError = string>(
  props: UseBaseDropzoneProps<TUploadRes, TUploadError>,
): UseBaseDropzoneReturn<TUploadRes, TUploadError> => {
  const {
    onDropFile: pOnDropFile,
    onRemoveFile: pOnRemoveFile,
    shapeUploadError: pShapeUploadError,
    onFileUploaded: pOnFileUploaded,
    onFileUploadError: pOnFileUploadError,
    onAllUploaded: pOnAllUploaded,
    onRootError: pOnRootError,
    maxRetryCount,
    autoRetry,
    validation,
    shiftOnMaxFiles,
  } = props;

  const inputId = useId();
  const rootMessageId = `${inputId}-root-message`;
  const rootDescriptionId = `${inputId}-description`;
  const [rootError, _setRootError] = useState<string | undefined>(undefined);

  const setRootError = useCallback(
    (error: string | undefined) => {
      _setRootError(error);
      if (pOnRootError !== undefined) {
        pOnRootError(error);
      }
    },
    [pOnRootError, _setRootError],
  );

  const [fileStatuses, dispatch] = useReducer(fileStatusReducer, []);

  const isInvalid = useMemo(() => {
    return (
      fileStatuses.filter((file) => file.status === "error").length > 0 ||
      rootError !== undefined
    );
  }, [fileStatuses, rootError]);

  const _uploadFile = useCallback(
    async (file: File, id: string, tries = 0) => {
      const result = await pOnDropFile(file);

      if (result.status === "error") {
        if (autoRetry === true && tries < (maxRetryCount ?? Infinity)) {
          dispatch({ type: "update-status", id, status: "pending" });
          return _uploadFile(file, id, tries + 1);
        }

        dispatch({
          type: "update-status",
          id,
          status: "error",
          error:
            pShapeUploadError !== undefined
              ? pShapeUploadError(result.error)
              : result.error,
        });
        if (pOnFileUploadError !== undefined) {
          pOnFileUploadError(result.error);
        }
        return;
      }
      if (pOnFileUploaded !== undefined) {
        pOnFileUploaded(result.result);
      }
      dispatch({
        type: "update-status",
        id,
        ...result,
      });
    },
    [
      autoRetry,
      maxRetryCount,
      pOnDropFile,
      pShapeUploadError,
      pOnFileUploadError,
      pOnFileUploaded,
    ],
  );

  const onRemoveFile = useCallback(
    async (id: string) => {
      await pOnRemoveFile?.(id);
      dispatch({ type: "remove", id });
    },
    [pOnRemoveFile],
  );

  const canRetry = useCallback(
    (id: string) => {
      const fileStatus = fileStatuses.find((file) => file.id === id);
      return (
        fileStatus?.status === "error" &&
        fileStatus.tries < (maxRetryCount ?? Infinity)
      );
    },
    [fileStatuses, maxRetryCount],
  );

  const onRetry = useCallback(
    async (id: string) => {
      if (!canRetry(id)) {
        return;
      }
      dispatch({ type: "update-status", id, status: "pending" });
      const fileStatus = fileStatuses.find((file) => file.id === id);
      if (!fileStatus || fileStatus.status !== "error") {
        return;
      }
      await _uploadFile(fileStatus.file, id);
    },
    [canRetry, fileStatuses, _uploadFile],
  );

  const getFileMessageId = (id: string) => `${inputId}-${id}-message`;

  const dropzone = rootUseBaseDropzone({
    accept: validation?.accept,
    minSize: validation?.minSize,
    maxSize: validation?.maxSize,
    onDropAccepted: async (newFiles) => {
      setRootError(undefined);

      // useBaseDropzone hook only checks max file count per group of uploaded files, allows going over if in multiple batches
      const fileCount = fileStatuses.length;
      const maxNewFiles =
        validation?.maxFiles === undefined
          ? Infinity
          : validation?.maxFiles - fileCount;

      if (maxNewFiles < newFiles.length && shiftOnMaxFiles !== true) {
        setRootError(getRootError(['too-many-files'], validation ?? {}));
      }

      const slicedNewFiles =
        shiftOnMaxFiles === true ? newFiles : newFiles.slice(0, maxNewFiles);

      const onDropFilePromises = slicedNewFiles.map(async (file, index) => {
        if (fileCount + 1 > maxNewFiles) {
          await onRemoveFile(fileStatuses[index].id);
        }

        const id = crypto.randomUUID();
        dispatch({ type: "add", fileName: file.name, file, id });
        await _uploadFile(file, id);
      });

      await Promise.all(onDropFilePromises);
      if (pOnAllUploaded !== undefined) {
        pOnAllUploaded();
      }
    },
    onDropRejected: (fileRejections) => {
      const errorMessage = getRootError(
        getDropZoneErrorCodes(fileRejections),
        validation ?? {},
      );
      setRootError(errorMessage);
    },
  });

  return {
    getRootProps: dropzone.getRootProps,
    getInputProps: dropzone.getInputProps,
    inputId,
    rootMessageId,
    rootDescriptionId,
    getFileMessageId,
    onRemoveFile,
    onRetry,
    canRetry,
    fileStatuses: fileStatuses as FileStatus<TUploadRes, TUploadError>[],
    isInvalid,
    rootError,
    isDragActive: dropzone.isDragActive,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DropZoneContext = createContext<UseBaseDropzoneReturn<any, any>>({
  getRootProps: () => ({}) as never,
  getInputProps: () => ({}) as never,
  onRemoveFile: async () => undefined,
  onRetry: async () => undefined,
  canRetry: () => false,
  fileStatuses: [],
  isInvalid: false,
  isDragActive: false,
  rootError: undefined,
  inputId: '',
  rootMessageId: '',
  rootDescriptionId: '',
  getFileMessageId: () => '',
});

const useBaseDropzoneContext = <TUploadRes, TUploadError>() => {
  return useContext(DropZoneContext) as UseBaseDropzoneReturn<
    TUploadRes,
    TUploadError
  >;
};

interface BaseDropzoneProps<TUploadRes, TUploadError>
  extends UseBaseDropzoneReturn<TUploadRes, TUploadError> {
  children: React.ReactNode;
}
const BaseDropzone = <TUploadRes, TUploadError>(
  props: BaseDropzoneProps<TUploadRes, TUploadError>,
) => {
  const { children, ...rest } = props;
  return (
    <DropZoneContext.Provider value={rest}>{children}</DropZoneContext.Provider>
  );
};
BaseDropzone.displayName = "BaseDropzone";

type BaseDropZoneAreaProps = React.HTMLAttributes<HTMLDivElement>;
const BaseDropZoneArea = forwardRef<HTMLDivElement, BaseDropZoneAreaProps>(
  ({ className, children, ...props }, forwardedRef) => {
    const context = useBaseDropzoneContext();

    if (!context) {
      throw new Error('BaseDropzoneArea must be used within a BaseDropzone');
    }

    const { onFocus, onBlur, onDragEnter, onDragLeave, onDrop, ref } =
      context.getRootProps();

    return (
      // Keyboard/click a11y is on BaseDropzoneTrigger; this node is for drag-and-drop.
      <div
        ref={(instance) => {
          ref.current = instance;
          if (typeof forwardedRef === "function") {
            forwardedRef(instance);
          } else if (forwardedRef) {
            forwardedRef.current = instance;
          }
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        {...props}
        aria-label="Vùng tải tệp"
        className={cn(
          'flex items-center justify-center rounded-md border border-dashed border-border bg-card px-4 py-8 outline-none focus-visible:ring-[3px] focus-visible:ring-accent-soft focus-visible:ring-offset-1 focus-visible:ring-offset-primary',
          context.isDragActive && 'border-primary bg-accent-soft/40',
          context.isInvalid && 'border-destructive',
          className,
        )}
      >
        {children}
      </div>
    );
  },
);
BaseDropZoneArea.displayName = "BaseDropZoneArea";

export type BaseDropzoneDescriptionProps =
  React.HTMLAttributes<HTMLParagraphElement>;

const BaseDropzoneDescription = forwardRef<
  HTMLParagraphElement,
  BaseDropzoneDescriptionProps
>((props, ref) => {
  const { className, ...rest } = props;
  const context = useBaseDropzoneContext();
  if (!context) {
    throw new Error('BaseDropzoneDescription must be used within a BaseDropzone');
  }

  return (
    <p
      ref={ref}
      id={context.rootDescriptionId}
      {...rest}
      className={cn('pb-1 text-sm text-muted-foreground', className)}
    />
  );
});
BaseDropzoneDescription.displayName = 'BaseDropzoneDescription';

interface BaseDropzoneFileListContextValue<TUploadRes, TUploadError> {
  onRemoveFile: () => Promise<void>;
  onRetry: () => Promise<void>;
  fileStatus: FileStatus<TUploadRes, TUploadError>;
  canRetry: boolean;
  dropzoneId: string;
  messageId: string;
}

const BaseDropzoneFileListContext = createContext<
  BaseDropzoneFileListContextValue<unknown, unknown>
>({
  onRemoveFile: async () => undefined,
  onRetry: async () => undefined,
  fileStatus: {} as FileStatus<unknown, unknown>,
  canRetry: false,
  dropzoneId: '',
  messageId: '',
});

const useBaseDropzoneFileListContext = () => {
  return useContext(BaseDropzoneFileListContext);
};

type DropZoneFileListProps = React.OlHTMLAttributes<HTMLOListElement>;

const BaseDropzoneFileList = forwardRef<HTMLOListElement, DropZoneFileListProps>(
  (props, ref) => {
    const context = useBaseDropzoneContext();
    if (!context) {
      throw new Error('BaseDropzoneFileList must be used within a BaseDropzone');
    }
    return (
      <ol
        ref={ref}
        aria-label="Danh sách tệp"
        {...props}
        className={cn('flex flex-col gap-4', props.className)}
      >
        {props.children}
      </ol>
    );
  },
);
BaseDropzoneFileList.displayName = "BaseDropzoneFileList";

interface BaseDropzoneFileListItemProps<TUploadRes, TUploadError>
  extends React.LiHTMLAttributes<HTMLLIElement> {
  file: FileStatus<TUploadRes, TUploadError>;
}

const BaseDropzoneFileListItem = forwardRef<
  HTMLLIElement,
  BaseDropzoneFileListItemProps<unknown, unknown>
>(({ className, ...props }, ref) => {
  const fileId = props.file.id;
  const {
    onRemoveFile: cOnRemoveFile,
    onRetry: cOnRetry,
    getFileMessageId: cGetFileMessageId,
    canRetry: cCanRetry,
    inputId: cInputId,
  } = useBaseDropzoneContext();

  const onRemoveFile = useCallback(
    () => cOnRemoveFile(fileId),
    [fileId, cOnRemoveFile],
  );
  const onRetry = useCallback(() => cOnRetry(fileId), [fileId, cOnRetry]);
  const messageId = cGetFileMessageId(fileId);
  const isInvalid = props.file.status === "error";
  const canRetry = useMemo(() => cCanRetry(fileId), [fileId, cCanRetry]);
  return (
    <BaseDropzoneFileListContext.Provider
      value={{
        onRemoveFile,
        onRetry,
        fileStatus: props.file,
        canRetry,
        dropzoneId: cInputId,
        messageId,
      }}
    >
      <li
        ref={ref}
        aria-label="Tệp đã chọn"
        aria-describedby={isInvalid ? messageId : undefined}
        className={cn(
          "flex flex-col justify-center gap-2 rounded-md bg-muted/40 px-4 py-2",
          className,
        )}
      >
        {props.children}
      </li>
    </BaseDropzoneFileListContext.Provider>
  );
});
BaseDropzoneFileListItem.displayName = "BaseDropzoneFileListItem";

type BaseDropzoneFileMessageProps = React.HTMLAttributes<HTMLParagraphElement>;

const BaseDropzoneFileMessage = forwardRef<
  HTMLParagraphElement,
  BaseDropzoneFileMessageProps
>((props, ref) => {
  const { children, ...rest } = props;
  const context = useBaseDropzoneFileListContext();
  if (!context) {
    throw new Error(
      'BaseDropzoneFileMessage must be used within a BaseDropzoneFileListItem',
    );
  }

  const body =
    context.fileStatus.status === 'error'
      ? String(context.fileStatus.error)
      : children;
  return (
    <p
      ref={ref}
      id={context.messageId}
      {...rest}
      className={cn(
        'h-5 text-[0.8rem] font-medium text-destructive',
        rest.className,
      )}
    >
      {body}
    </p>
  );
});
BaseDropzoneFileMessage.displayName = 'BaseDropzoneFileMessage';

type BaseDropzoneMessageProps = React.HTMLAttributes<HTMLParagraphElement>;

const BaseDropzoneMessage = forwardRef<HTMLParagraphElement, BaseDropzoneMessageProps>(
  (props, ref) => {
    const { children, ...rest } = props;
    const context = useBaseDropzoneContext();
    if (!context) {
      throw new Error('BaseDropzoneRootMessage must be used within a BaseDropzone');
    }

    const body = context.rootError ? String(context.rootError) : children;
    return (
      <p
        ref={ref}
        id={context.rootMessageId}
        {...rest}
        className={cn(
          'h-5 text-[0.8rem] font-medium text-destructive',
          rest.className,
        )}
      >
        {body}
      </p>
    );
  },
);
BaseDropzoneMessage.displayName = 'BaseDropzoneMessage';

type BaseDropzoneRemoveFileProps = ButtonProps;

const BaseDropzoneRemoveFile = forwardRef<
  HTMLButtonElement,
  BaseDropzoneRemoveFileProps
>(({ className, ...props }, ref) => {
  const context = useBaseDropzoneFileListContext();
  if (!context) {
    throw new Error(
      'BaseDropzoneRemoveFile must be used within a BaseDropzoneFileListItem',
    );
  }
  return (
    <Button
      ref={ref}
      onClick={context.onRemoveFile}
      type="button"
      size="icon"
      {...props}
      className={cn(
        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
        className,
      )}
    >
      {props.children}
      <span className="sr-only">Xóa tệp</span>
    </Button>
  );
});
BaseDropzoneRemoveFile.displayName = 'BaseDropzoneRemoveFile';

type BaseDropzoneRetryFileProps = ButtonProps;

const BaseDropzoneRetryFile = forwardRef<HTMLButtonElement, BaseDropzoneRetryFileProps>(
  ({ className, ...props }, ref) => {
    const context = useBaseDropzoneFileListContext();

    if (!context) {
      throw new Error(
        'BaseDropzoneRetryFile must be used within a BaseDropzoneFileListItem',
      );
    }

    const canRetry = context.canRetry;

    return (
      <Button
        ref={ref}
        aria-disabled={!canRetry}
        aria-label="Thử lại"
        onClick={context.onRetry}
        type="button"
        size="icon"
        {...props}
        className={cn(
          'aria-disabled:pointer-events-none aria-disabled:opacity-50',
          className,
        )}
      >
        {props.children}
        <span className="sr-only">Thử lại</span>
      </Button>
    );
  },
);
BaseDropzoneRetryFile.displayName = "BaseDropzoneRetryFile";

type BaseDropzoneTriggerProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const BaseDropzoneTrigger = forwardRef<HTMLLabelElement, BaseDropzoneTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = useBaseDropzoneContext();
    if (!context) {
      throw new Error('BaseDropzoneTrigger must be used within a BaseDropzone');
    }

    const { fileStatuses, getFileMessageId } = context;

    const fileMessageIds = useMemo(
      () =>
        fileStatuses
          .filter((file) => file.status === "error")
          .map((file) => getFileMessageId(file.id)),
      [fileStatuses, getFileMessageId],
    );

    return (
      <label
        ref={ref}
        {...props}
        className={cn(
          'cursor-pointer rounded-md bg-secondary px-4 py-2 font-medium text-secondary-foreground transition-colors focus-within:outline-none hover:bg-secondary/80 has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-accent-soft has-[input:focus-visible]:ring-offset-1 has-[input:focus-visible]:ring-offset-primary',
          className,
        )}
      >
        {children}
        <input
          {...context.getInputProps({
            style: {
              display: undefined,
            },
            className: "sr-only",
            tabIndex: undefined,
          })}
          aria-describedby={
            context.isInvalid
              ? [context.rootMessageId, ...fileMessageIds].join(" ")
              : undefined
          }
          aria-invalid={context.isInvalid}
        />
      </label>
    );
  },
);
BaseDropzoneTrigger.displayName = "BaseDropzoneTrigger";

interface BaseInfiniteProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  status: "pending" | "success" | "error";
}

const valueTextMap = {
  pending: "indeterminate",
  success: "100%",
  error: "error",
};

const BaseInfiniteProgress = forwardRef<HTMLDivElement, BaseInfiniteProgressProps>(
  ({ className, ...props }, ref) => {
    const done = props.status === "success" || props.status === "error";
    const error = props.status === "error";
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={valueTextMap[props.status]}
        {...props}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-muted",
          className,
        )}
      >
        <div
          //   TODO: add proper done transition
          className={cn(
            "h-full w-full rounded-full bg-primary",
            done ? "translate-x-0" : "animate-infinite-progress",
            error && "bg-destructive",
          )}
        />
      </div>
    );
  },
);
BaseInfiniteProgress.displayName = "BaseInfiniteProgress";

export {
  BaseDropzone,
  BaseDropZoneArea,
  BaseDropzoneDescription,
  BaseDropzoneFileList,
  BaseDropzoneFileListItem,
  BaseDropzoneFileMessage,
  BaseDropzoneMessage,
  BaseDropzoneRemoveFile,
  BaseDropzoneRetryFile,
  BaseDropzoneTrigger,
  BaseInfiniteProgress,
  useBaseDropzone,
};
