import {Skeleton, useTheme} from "@mui/material";
import {useYamlParser} from "@services/yaml-parser";

import React from "react";

import {useAppSelector} from "@redux/hooks";

import {EventSource} from "@shared-types/files";
import {
    GroupType,
    NavigationItemType,
    NavigationType,
    PageType,
    SectionType,
} from "@shared-types/navigation";
import {YamlLayoutObjectType} from "../../utils/yaml-parser";

import {Group} from "./components/Group";
import {Page} from "./components/Page";
import {Section} from "./components/Section";
import "./menu.css";

type MenuProps = {
    navigationItems: NavigationType;
};

const makeNavigation = (
    navigation: NavigationType,
    initiallyCollapsed: boolean,
    activePageId: string,
    onPageChange: (url: string) => void
): JSX.Element => {
    const recursivelyMakeNavigation = (
        items: NavigationItemType[],
        iconAtParentLevel?: boolean,
        level = 1
    ): JSX.Element => {
        const atLeastOneIconUsed = items.some(el => el.icon !== undefined);
        return (
            <>
                {items.map(item => {
                    if (item.type === "section") {
                        return (
                            <Section
                                key={item.id}
                                title={item.title}
                                icon={item.icon}
                                applyIconIndentation={atLeastOneIconUsed}
                            >
                                {recursivelyMakeNavigation(
                                    (item as SectionType).content,
                                    atLeastOneIconUsed
                                )}
                            </Section>
                        );
                    }
                    if (item.type === "group") {
                        return (
                            <Group
                                id={item.id}
                                key={item.id}
                                level={level}
                                title={item.title}
                                icon={item.icon}
                                forceOpen
                                applyIconIndentation={
                                    atLeastOneIconUsed ||
                                    iconAtParentLevel ||
                                    false
                                }
                                initiallyCollapsed={initiallyCollapsed}
                            >
                                {recursivelyMakeNavigation(
                                    (item as GroupType).content,
                                    atLeastOneIconUsed,
                                    level + 1
                                )}
                            </Group>
                        );
                    }
                    if (item.type === "page") {
                        return (
                            <Page
                                active={item.id === activePageId}
                                key={item.id}
                                level={level}
                                applyIconIndentation={
                                    atLeastOneIconUsed ||
                                    iconAtParentLevel ||
                                    false
                                }
                                {...(item as PageType)}
                                onClick={() =>
                                    onPageChange((item as PageType).href)
                                }
                            />
                        );
                    }
                    return null;
                })}
            </>
        );
    };
    return recursivelyMakeNavigation(navigation);
};

export type SelectedNavigationItem = {
    type: Omit<
        YamlLayoutObjectType,
        YamlLayoutObjectType.Plugin | YamlLayoutObjectType.PlainText
    >;
    number: number;
};

export const Menu: React.FC<MenuProps> = props => {
    const menuRef = React.useRef<HTMLDivElement | null>(null);

    const theme = useTheme();
    const yamlParser = useYamlParser();

    const currentFile = useAppSelector(state =>
        state.files.files.find(el => el.filePath === state.files.activeFile)
    );
    const currentPageId = currentFile?.currentPage?.id || "";
    const selectedYamlObject = currentFile?.selectedYamlObject;
    let selectedNavigationItem: SelectedNavigationItem | null = null;

    if (selectedYamlObject) {
        if (
            "type" in selectedYamlObject &&
            "number" in selectedYamlObject &&
            (selectedYamlObject["type"] === YamlLayoutObjectType.Section ||
                selectedYamlObject["type"] === YamlLayoutObjectType.Group ||
                selectedYamlObject["type"] === YamlLayoutObjectType.Page)
        ) {
            selectedNavigationItem = {
                type: selectedYamlObject["type"],
                number: selectedYamlObject["number"],
            };
        }
    }

    const handlePageChange = (pageId: string) => {
        if (pageId !== "") {
            yamlParser.setCurrentPage(pageId, EventSource.Preview);
        }
    };

    React.useEffect(() => {
        if (menuRef.current) {
            Array.from(
                menuRef.current.getElementsByClassName("Menu__SelectedItem")
            ).forEach((element: Element) => {
                element.classList.remove("Menu__SelectedItem");
            });
            if (selectedNavigationItem) {
                if (
                    selectedNavigationItem.type === YamlLayoutObjectType.Section
                ) {
                    const section = menuRef.current.getElementsByClassName(
                        "Menu__Section"
                    )[selectedNavigationItem.number] as HTMLElement | undefined;
                    if (section) {
                        section.classList.add("Menu__SelectedItem");
                    }
                } else if (
                    selectedNavigationItem.type === YamlLayoutObjectType.Group
                ) {
                    const group = menuRef.current.getElementsByClassName(
                        "Menu__Group"
                    )[selectedNavigationItem.number] as HTMLElement | undefined;
                    if (group) {
                        group.classList.add("Menu__SelectedItem");
                    }
                } else if (
                    selectedNavigationItem.type === YamlLayoutObjectType.Page
                ) {
                    const page = menuRef.current.getElementsByClassName(
                        "Menu__Page"
                    )[selectedNavigationItem.number] as HTMLElement | undefined;
                    if (page) {
                        page.classList.add("Menu__SelectedItem");
                    }
                }
            }
        }
    }, [selectedNavigationItem]);

    return (
        <div
            style={{color: theme.palette.text.primary}}
            ref={menuRef}
            className="Menu"
        >
            {props.navigationItems.length > 0 &&
                makeNavigation(
                    props.navigationItems,
                    false,
                    currentPageId,
                    handlePageChange
                )}
            {props.navigationItems.length === 0 && (
                <>
                    {" "}
                    {[0, 1, 2].map(el => (
                        <Skeleton
                            animation={false}
                            key={`SkeletonBar${el}`}
                            sx={{p: 1}}
                        />
                    ))}
                </>
            )}
        </div>
    );
};
