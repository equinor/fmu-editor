export type ConfirmationDialog = {
    title: string;
    content: string;
    confirmText: string;
    confirmFunc: () => void;
    closeText: string;
    closeFunc: () => void;
};
