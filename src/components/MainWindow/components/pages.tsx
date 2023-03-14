import React from "react";

type PageComponentProps = {
    visible: boolean;
    children: React.ReactNode;
};

export const PageComponent: React.FC<PageComponentProps> = props => {
    return (
        <div style={{display: props.visible ? "block" : "none", width: "100%", height: "100%"}}>{props.children}</div>
    );
};

type PagesProps = {
    activePage: string;
    children: React.ReactElement[];
};

export const Pages: React.FC<PagesProps> = props => {
    return (
        <div style={{width: "100%", height: "100%"}}>
            {React.Children.map(props.children, (child: React.ReactElement) => {
                return (
                    <PageComponent visible={child.props.name === props.activePage}>
                        {child.props.children}
                    </PageComponent>
                );
            })}
        </div>
    );
};
