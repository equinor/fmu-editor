import React from "react";
import {VscChevronDown, VscChevronRight} from "react-icons/vsc";

import {Directory} from "@utils/file-system/directory";
import {File} from "@utils/file-system/file";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setFileTreeStates} from "@redux/reducers/files";

import {v4} from "uuid";

import {FileComponent} from "./file-component";

export type DirectoryComponentProps = {
    level: number;
    directory: Directory;
};

export const DirectoryComponent: React.VFC<DirectoryComponentProps> = props => {
    const fileTreeStates = useAppSelector(state => state.files.fileTreeStates[state.files.directory]);
    const [expanded, setExpanded] = React.useState<boolean>(true);

    const dispatch = useAppDispatch();

    React.useLayoutEffect(() => {
        if (fileTreeStates && fileTreeStates.includes(props.directory.relativePath())) {
            setExpanded(true);
            return;
        }
        setExpanded(false);
    }, [fileTreeStates, props.directory]);

    const handleDirStateChange = React.useCallback(
        (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
            let newFileTreeStates = [...fileTreeStates];

            if (fileTreeStates.includes(props.directory.relativePath()) && expanded) {
                newFileTreeStates = [...newFileTreeStates.filter(el => el !== props.directory.relativePath())];
            } else if (!expanded) {
                newFileTreeStates = [...newFileTreeStates, props.directory.relativePath()];
            }

            dispatch(setFileTreeStates(newFileTreeStates));
            e.preventDefault();
        },
        [fileTreeStates, dispatch, expanded, props.directory]
    );

    return (
        <div className="Directory">
            <a
                className="ExplorerItem"
                href="#"
                onClick={e => handleDirStateChange(e)}
                title={props.directory.relativePath()}
            >
                {props.level > 1 &&
                    Array(props.level - 1)
                        .fill(0)
                        .map(_ => <div className="ExplorerPath" key={`${props.directory.baseName()}-${v4()}}`} />)}
                <div className="ExplorerItemIcon">
                    {expanded ? <VscChevronDown fontSize="small" /> : <VscChevronRight fontSize="small" />}
                </div>
                <div className="ExplorerItemText">{props.directory.baseName()}</div>
            </a>
            <div className="DirectoryContent">
                {expanded &&
                    props.directory &&
                    props.directory.getContent().map(item => {
                        if (!item.isDirectory()) {
                            return <FileComponent key={item.relativePath()} level={props.level} file={item as File} />;
                        }
                        return (
                            <DirectoryComponent
                                level={props.level + 1}
                                directory={item as Directory}
                                key={item.relativePath()}
                            />
                        );
                    })}
            </div>
        </div>
    );
};
