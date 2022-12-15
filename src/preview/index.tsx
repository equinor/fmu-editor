/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MPLv2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from "react";
import ReactDOM from "react-dom";

import "./index.css";
import {Preview} from "./preview";

ReactDOM.render(
    <React.StrictMode>
        <Preview />
    </React.StrictMode>,
    document.getElementById("root")
);
