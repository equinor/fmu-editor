import React from "react";

type PageComponentProps = {
    visible?: boolean;
    children: React.ReactNode;
};

export const PageComponent: React.FC<PageComponentProps> = props => {
    const display = props.visible !== undefined ? (props.visible ? "block" : "none") : "block";
    return <div style={{display, width: "100%", height: "100%"}}>{props.children}</div>;
};

type PagesProps = {
    activePage: string;
    children: React.ReactElement[];
};

export const Pages: React.FC<PagesProps> = props => {
    return (
        <div style={{width: "100%", height: "100%"}}>
            {React.Children.map(props.children, (child: React.ReactElement) => {
                if (child.props.name !== props.activePage && !child.props.persistent) {
                    return null;
                }

                return (
                    <PageComponent visible={child.props.persistent ? child.props.name === props.activePage : undefined}>
                        {child.props.children}
                    </PageComponent>
                );
            })}
        </div>
    );
};
