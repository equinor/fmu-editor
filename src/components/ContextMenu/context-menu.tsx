import React from "react";

import "./context-menu.css";

export type ContextMenuTemplate = {
    label: string;
    shortcut: string;
    click: () => void;
}[];

export type ContextMenuProps = {
    template: ContextMenuTemplate;
    parent: HTMLElement;
};

export const ContextMenu: React.VFC<ContextMenuProps> = props => {
    const [visible, setVisible] = React.useState(false);
    const [position, setPosition] = React.useState({x: 0, y: 0});

    const overlayRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setPosition({x: e.clientX, y: e.clientY});
            setVisible(true);
        };

        const handleAwayClick = () => {
            setVisible(false);
        };

        if (props.parent) {
            props.parent.addEventListener("contextmenu", handleContextMenu);
        }

        if (overlayRef.current) {
            overlayRef.current.addEventListener("mousedown", handleAwayClick);
        }

        return () => {
            if (props.parent) {
                props.parent.removeEventListener("contextmenu", handleContextMenu);
            }
            if (overlayRef.current) {
                overlayRef.current.removeEventListener("mousedown", handleAwayClick);
            }
        };
    }, [props.template, props.parent, visible]);

    if (!visible) {
        return null;
    }

    const handleItemClick = (func: () => void) => {
        func();
        setVisible(false);
    };

    return (
        <div className="ContextMenuOverlay" ref={overlayRef}>
            <div className="ContextMenu" style={{left: position.x, top: position.y}}>
                {props.template.map(item => (
                    <div key={item.label} className="ContextMenuItem" onClick={() => handleItemClick(item.click)}>
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
    );
};
