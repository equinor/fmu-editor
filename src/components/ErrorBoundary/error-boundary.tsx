import React from "react";

export type ErrorBoundaryProps = {
    errorMessage: string;
    children?: React.ReactElement;
};

export class ErrorBoundary extends React.Component {
    public props: ErrorBoundaryProps;
    public state: { hasError: boolean };
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.props = props;
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): { hasError: boolean } {
        return { hasError: true };
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return <h1>{this.props.errorMessage}.</h1>;
        }

        return this.props.children;
    }
}
