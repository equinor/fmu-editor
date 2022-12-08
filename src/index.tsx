/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MPLv2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {Providers} from "@microsoft/mgt-element";
import {Msal2Provider} from "@microsoft/mgt-msal2-provider";

import React from "react";
import ReactDOM from "react-dom";
import {Provider} from "react-redux";

import "@redux/ipc-renderer-redux";
import store from "@redux/store";

import App from "./App";
import "./index.css";
import reportWebVitals from "./reportWebVitals";

Providers.globalProvider = new Msal2Provider({
    clientId: "6f2755e8-06e5-4f2e-8129-029c1c71d347",
    scopes: ["user.read", "openid", "profile", "people.read", "user.readbasic.all"],
});

ReactDOM.render(
    <React.StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </React.StrictMode>,
    document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
