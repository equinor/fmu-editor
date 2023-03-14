import {useIsSignedIn} from "@hooks/useIsMicrosoftUserSignedIn";
import {getUserWithPhoto} from "@microsoft/mgt-components/src/graph/graph.userWithPhoto";
import {IDynamicPerson, ProviderState, Providers} from "@microsoft/mgt-react";
import {Logout, Person} from "@mui/icons-material";
import {Avatar, CircularProgress, IconButton, ListItemIcon, Menu, MenuItem} from "@mui/material";
import {notificationsService} from "@services/notifications-service";

import React from "react";

import {NotificationType} from "@shared-types/notifications";

import uniqolor from "uniqolor";

export const Login: React.VFC = () => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const [userDetails, setUserDetails] = React.useState<IDynamicPerson | null>(null);
    const signedIn = useIsSignedIn();

    const handleSigninClick = async () => {
        const provider = Providers.globalProvider;
        if (provider && provider.login) {
            await provider.login();

            if (provider.state === ProviderState.SignedIn) {
                fetchUserDetails();
            } else {
                handleLoginFailed();
            }
        }
    };

    const fetchUserDetails = React.useCallback(() => {
        const provider = Providers.globalProvider;
        if (provider && !userDetails) {
            if (provider.state === ProviderState.SignedIn) {
                getUserWithPhoto(provider.graph).then(user => {
                    setUserDetails(user);
                });
            } else {
                setUserDetails(null);
            }
        }
    }, [userDetails]);

    React.useEffect(() => {
        if (signedIn && !userDetails) {
            fetchUserDetails();
        }
    }, [signedIn, userDetails, fetchUserDetails]);

    const handleSignoutClick = async () => {
        const provider = Providers.globalProvider;
        if (provider && provider.logout) {
            await provider.logout();
            setUserDetails(null);
        }
    };

    const handleLoginFailed = () => {
        notificationsService.publishNotification({
            type: NotificationType.ERROR,
            message: `Login failed.`,
        });
    };

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    if (signedIn) {
        if (userDetails) {
            return (
                <>
                    <IconButton onClick={handleClick}>
                        <Avatar
                            sx={{backgroundColor: uniqolor(userDetails.displayName || "").color, width: 32, height: 32}}
                            src={userDetails.personImage || ""}
                            alt={`${userDetails.givenName || ""} ${userDetails.surname || ""}`}
                            title={userDetails.displayName || ""}
                        >
                            {userDetails.givenName.at(0) || ""}
                        </Avatar>
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        onClick={handleClose}
                        transformOrigin={{horizontal: "left", vertical: "bottom"}}
                        anchorOrigin={{horizontal: "right", vertical: "bottom"}}
                    >
                        <MenuItem onClick={() => handleSignoutClick()}>
                            <ListItemIcon>
                                <Logout fontSize="small" />
                            </ListItemIcon>
                            Sign out
                        </MenuItem>
                    </Menu>
                </>
            );
        }
        return <CircularProgress sx={{width: 24, height: 24}} />;
    }

    return (
        <IconButton color="primary" size="large" title="Sign in to Microsoft" onClick={() => handleSigninClick()}>
            <Person />
        </IconButton>
    );
};
