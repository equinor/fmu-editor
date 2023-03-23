import React from "react";

type PageProps = {
    /* eslint-disable-next-line react/no-unused-prop-types */
    name: string;
    /* eslint-disable-next-line react/no-unused-prop-types */
    persistent?: boolean;
    children: React.ReactNode;
};

export const Page: React.FC<PageProps> = props => {
    return <>{props.children}</>;
};
