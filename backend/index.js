require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const crypto = require("crypto");
const session = require("express-session");

const app = express();

const PORT = process.env.PORT || 5000;

// ======================================================
// ALLOWED FRONTEND ORIGINS
// ======================================================

const allowedOrigins = [
    "https://cloudvandana-crud-frontend.onrender.com"
];

// ======================================================
// MIDDLEWARE
// ======================================================

app.set("trust proxy", 1);

app.use(
    cors({
        origin: function (origin, callback) {

            // Allow requests without an Origin
            // such as Postman/server-to-server requests
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("CORS: Origin not allowed")
            );
        },

        credentials: true
    })
);

app.use(express.json());

// ======================================================
// SESSION
// ======================================================

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "development-only-change-this-secret",

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,

            secure:
                process.env.NODE_ENV === "production",

            sameSite: "lax",

            maxAge:
                24 * 60 * 60 * 1000
        }
    })
);

// ======================================================
// SALESFORCE OBJECT CONFIGURATION
// ======================================================

const objectConfig = {

    Account: {

        fields: [
            "Id",
            "Name",
            "Phone",
            "Website",
            "Industry",
            "Rating"
        ],

        createFields: [
            "Name",
            "Phone",
            "Website",
            "Industry",
            "Rating"
        ]
    },


    Opportunity: {

        fields: [
            "Id",
            "Name",
            "Amount",
            "StageName",
            "CloseDate",
            "Probability",
            "Type"
        ],

        createFields: [
            "Name",
            "Amount",
            "StageName",
            "CloseDate",
            "Probability",
            "Type"
        ]
    },


    Lead: {

        fields: [
            "Id",
            "FirstName",
            "LastName",
            "Company",
            "Email",
            "Phone",
            "Status"
        ],

        createFields: [
            "FirstName",
            "LastName",
            "Company",
            "Email",
            "Phone",
            "Status"
        ]
    },


    Contact: {

        fields: [
            "Id",
            "FirstName",
            "LastName",
            "Email",
            "Phone",
            "Department",
            "Title"
        ],

        createFields: [
            "FirstName",
            "LastName",
            "Email",
            "Phone",
            "Department",
            "Title"
        ]
    },


    Case: {

        fields: [
            "Id",
            "CaseNumber",
            "Subject",
            "Status",
            "Priority",
            "Origin",
            "Description"
        ],

        createFields: [
            "Subject",
            "Status",
            "Priority",
            "Origin",
            "Description"
        ]
    }
};

const allowedObjects =
    Object.keys(objectConfig);


// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {

    res.send(
        "CloudVandana CRUD Backend is running"
    );

});


// ======================================================
// SALESFORCE LOGIN
// ======================================================

app.get("/auth/login", (req, res) => {

    try {

        // ----------------------------------------------
        // Generate PKCE verifier for THIS SESSION
        // ----------------------------------------------

        const codeVerifier =
            crypto
                .randomBytes(64)
                .toString("base64url");

        const codeChallenge =
            crypto
                .createHash("sha256")
                .update(codeVerifier)
                .digest("base64url");


        // ----------------------------------------------
        // Generate OAuth state for THIS SESSION
        // ----------------------------------------------

        const state =
            crypto
                .randomBytes(32)
                .toString("hex");


        // ----------------------------------------------
        // Store OAuth information in user's session
        // ----------------------------------------------

        req.session.codeVerifier =
            codeVerifier;

        req.session.oauthState =
            state;


        // ----------------------------------------------
        // Salesforce authorization URL
        // ----------------------------------------------

        const authUrl =
            `${process.env.SF_LOGIN_URL}/services/oauth2/authorize` +
            `?response_type=code` +
            `&prompt=login` +
            `&client_id=${encodeURIComponent(
                process.env.SF_CLIENT_ID
            )}` +
            `&redirect_uri=${encodeURIComponent(
                process.env.SF_CALLBACK_URL
            )}` +
            `&state=${encodeURIComponent(
                state
            )}` +
            `&code_challenge=${encodeURIComponent(
                codeChallenge
            )}` +
            `&code_challenge_method=S256`;


        console.log(
            "Opening Salesforce login..."
        );

        res.redirect(authUrl);

    } catch (error) {

        console.error(
            "Login URL generation error:",
            error
        );

        res.status(500).json({
            message:
                "Unable to start Salesforce login"
        });
    }
});


// ======================================================
// SALESFORCE CALLBACK
// ======================================================

app.get(
    "/auth/callback",
    async (req, res) => {

        const {
            code,
            state,
            error,
            error_description
        } = req.query;


        console.log(
            "OAuth callback query:",
            req.query
        );


        // ----------------------------------------------
        // Salesforce returned an OAuth error
        // ----------------------------------------------

        if (error) {

            return res.status(400).json({

                message:
                    "Salesforce OAuth authorization failed",

                error:
                    error,

                error_description:
                    error_description
            });
        }


        // ----------------------------------------------
        // Authorization code check
        // ----------------------------------------------

        if (!code) {

            return res.status(400).json({

                message:
                    "Authorization code not received",

                callbackQuery:
                    req.query
            });
        }


        // ----------------------------------------------
        // State validation
        // ----------------------------------------------

        if (
            !state ||
            state !== req.session.oauthState
        ) {

            return res.status(400).json({

                message:
                    "Invalid OAuth state"
            });
        }


        // ----------------------------------------------
        // Get PKCE verifier from THIS user's session
        // ----------------------------------------------

        const codeVerifier =
            req.session.codeVerifier;


        if (!codeVerifier) {

            return res.status(400).json({

                message:
                    "PKCE code verifier not found"
            });
        }


        try {

            // ------------------------------------------
            // Exchange authorization code for token
            // ------------------------------------------

            const response =
                await axios.post(

                    `${process.env.SF_LOGIN_URL}/services/oauth2/token`,

                    new URLSearchParams({

                        grant_type:
                            "authorization_code",

                        code:
                            code,

                        client_id:
                            process.env.SF_CLIENT_ID,

                        client_secret:
                            process.env.SF_CLIENT_SECRET,

                        redirect_uri:
                            process.env.SF_CALLBACK_URL,

                        code_verifier:
                            codeVerifier

                    }),

                    {
                        headers: {
                            "Content-Type":
                                "application/x-www-form-urlencoded"
                        }
                    }
                );


            // ------------------------------------------
            // Store Salesforce information
            // in THIS user's session
            // ------------------------------------------

            req.session.accessToken =
                response.data.access_token;

            req.session.instanceUrl =
                response.data.instance_url;


            if (
                response.data.refresh_token
            ) {

                req.session.refreshToken =
                    response.data.refresh_token;
            }


            // ------------------------------------------
            // Remove temporary OAuth information
            // ------------------------------------------

            delete req.session.codeVerifier;

            delete req.session.oauthState;


            console.log(
                "Salesforce login successful!"
            );

            console.log(
                "Instance URL:",
                req.session.instanceUrl
            );

            console.log(
                "Access Token received:",
                !!req.session.accessToken
            );


            // ------------------------------------------
            // Save session before redirect
            // ------------------------------------------

            req.session.save((err) => {

                if (err) {

                    console.error(
                        "Session save error:",
                        err
                    );

                    return res.status(500).json({

                        message:
                            "Failed to save login session"

                    });
                }

                
                const frontendUrl =
                    process.env.FRONTEND_URL;
                    if (!frontendUrl) {
                        return res.status(500).json({
                            message: "Frontend URL not configured"
                        });
                    }

                res.redirect(
                    frontendUrl
                );

            });

        } catch (error) {

            console.error(

                "Salesforce OAuth Error:",

                error.response?.data ||
                error.message

            );


            res.status(500).json({

                message:
                    "Salesforce login failed",

                error:
                    error.response?.data ||
                    error.message

            });
        }
    }
);


// ======================================================
// LOGIN STATUS
// ======================================================

app.get(
    "/api/status",
    (req, res) => {

        res.json({

            loggedIn:
                !!req.session.accessToken,

            instance_url:
                req.session.instanceUrl ||
                null

        });

    }
);


// ======================================================
// GET RECORDS
// 20 RECORDS AT A TIME
// ======================================================

app.get(
    "/api/records",
    async (req, res) => {

        if (
            !req.session.accessToken ||
            !req.session.instanceUrl
        ) {

            return res.status(401).json({

                message:
                    "Not logged in to Salesforce"

            });
        }


        const object =
            req.query.object ||
            "Contact";


        const nextUrl =
            req.query.nextUrl;


        if (
            !allowedObjects.includes(object)
        ) {

            return res.status(400).json({

                message:
                    "Invalid Salesforce object"

            });
        }


        try {

            let response;


            // ==================================================
            // NEXT 20
            // ==================================================

            if (nextUrl) {

                if (
                    !nextUrl.startsWith(
                        "/services/data/"
                    )
                ) {

                    return res
                        .status(400)
                        .json({

                            message:
                                "Invalid next records URL"

                        });
                }


                response =
                    await axios.get(

                        `${req.session.instanceUrl}${nextUrl}`,

                        {

                            headers: {

                                Authorization:
                                    `Bearer ${req.session.accessToken}`

                            }

                        }

                    );

            }


            // ==================================================
            // FIRST 20
            // ==================================================

            else {

                const fields =
                    objectConfig[
                        object
                    ]
                    .fields
                    .join(", ");


                const query =
                    `SELECT ${fields} ` +
                    `FROM ${object} ` +
                    `ORDER BY CreatedDate DESC `;


                console.log(
                    `Fetching first 20 ${object} records...`
                );


                response =
                    await axios.get(

                        `${req.session.instanceUrl}/services/data/v65.0/query`,

                        {

                            params: {
                                q: query
                            },

                            headers: {

                                Authorization:
                                    `Bearer ${req.session.accessToken}`,

                                "Sforce-Query-Options":
                                    "batchSize=20"

                            }

                        }

                    );

            }


            res.json({

                records:
                    response.data.records ||
                    [],

                nextRecordsUrl:
                    response.data.nextRecordsUrl ||
                    null,

                done:
                    response.data.done === true

            });


        } catch (error) {

            console.error(

                `Salesforce ${object} Read Error:`,

                error.response?.data ||
                error.message

            );


            res.status(500).json({

                message:
                    `Failed to fetch ${object} records`,

                error:
                    error.response?.data ||
                    error.message

            });

        }

    }
);


// ======================================================
// CREATE RECORD
// ======================================================

app.post(
    "/api/records",
    async (req, res) => {

        if (
            !req.session.accessToken ||
            !req.session.instanceUrl
        ) {

            return res.status(401).json({

                message:
                    "Not logged in to Salesforce"

            });
        }


        const object =
            req.body.object;

        const record =
            req.body.record;


        if (
            !allowedObjects.includes(object)
        ) {

            return res.status(400).json({

                message:
                    "Invalid Salesforce object"

            });
        }


        if (
            !record ||
            typeof record !== "object"
        ) {

            return res.status(400).json({

                message:
                    "Record data is required"

            });
        }


        const allowedFields =
            objectConfig[
                object
            ].createFields;


        const salesforceRecord = {};


        allowedFields.forEach(
            (field) => {

                if (
                    record[field] !==
                        undefined &&
                    record[field] !== ""
                ) {

                    salesforceRecord[field] =
                        record[field];

                }

            }
        );


        // ==================================================
        // DEFAULT VALUES
        // ==================================================

        if (
            object === "Opportunity"
        ) {

            if (
                !salesforceRecord.StageName
            ) {

                salesforceRecord.StageName =
                    "Prospecting";

            }

        }


        if (
            object === "Case"
        ) {

            if (
                !salesforceRecord.Status
            ) {

                salesforceRecord.Status =
                    "New";

            }

            if (
                !salesforceRecord.Origin
            ) {

                salesforceRecord.Origin =
                    "Web";

            }

            if (
                !salesforceRecord.Priority
            ) {

                salesforceRecord.Priority =
                    "Medium";

            }

        }


        // ==================================================
        // REQUIRED FIELDS
        // ==================================================

        if (
            object === "Account" &&
            !salesforceRecord.Name
        ) {

            return res.status(400).json({

                message:
                    "Account Name is required"

            });

        }


        if (
            object === "Opportunity" &&
            (
                !salesforceRecord.Name ||
                !salesforceRecord.CloseDate
            )
        ) {

            return res.status(400).json({

                message:
                    "Opportunity Name and Close Date are required"

            });

        }


        if (
            object === "Lead" &&
            (
                !salesforceRecord.LastName ||
                !salesforceRecord.Company
            )
        ) {

            return res.status(400).json({

                message:
                    "Lead Last Name and Company are required"

            });

        }


        if (
            object === "Contact" &&
            !salesforceRecord.LastName
        ) {

            return res.status(400).json({

                message:
                    "Contact Last Name is required"

            });

        }


        if (
            object === "Case" &&
            !salesforceRecord.Subject
        ) {

            return res.status(400).json({

                message:
                    "Case Subject is required"

            });

        }


        try {

            const response =
                await axios.post(

                    `${req.session.instanceUrl}/services/data/v65.0/sobjects/${object}`,

                    salesforceRecord,

                    {

                        headers: {

                            Authorization:
                                `Bearer ${req.session.accessToken}`,

                            "Content-Type":
                                "application/json"

                        }

                    }

                );


            console.log(
                `${object} created successfully!`
            );


            res.status(201).json({

                message:
                    "Record created successfully",

                id:
                    response.data.id

            });


        } catch (error) {

            console.error(

                `Salesforce ${object} Create Error:`,

                error.response?.data ||
                error.message

            );


            res.status(500).json({

                message:
                    `Failed to create ${object}`,

                error:
                    error.response?.data ||
                    error.message

            });

        }

    }
);


// ======================================================
// UPDATE RECORD
// ======================================================

app.put(
    "/api/records/:object/:id",
    async (req, res) => {

        if (
            !req.session.accessToken ||
            !req.session.instanceUrl
        ) {

            return res.status(401).json({

                message:
                    "Not logged in to Salesforce"

            });

        }


        const {
            object,
            id
        } = req.params;


        const record =
            req.body.record;


        if (
            !allowedObjects.includes(object)
        ) {

            return res.status(400).json({

                message:
                    "Invalid Salesforce object"

            });

        }


        if (
            !record ||
            typeof record !== "object"
        ) {

            return res.status(400).json({

                message:
                    "Record data is required"

            });

        }


        const allowedFields =
            objectConfig[
                object
            ].createFields;


        const salesforceRecord = {};


        allowedFields.forEach(
            (field) => {

                if (
                    record[field] !==
                    undefined
                ) {

                    salesforceRecord[field] =
                        record[field];

                }

            }
        );


        try {

            await axios.patch(

                `${req.session.instanceUrl}/services/data/v65.0/sobjects/${object}/${id}`,

                salesforceRecord,

                {

                    headers: {

                        Authorization:
                            `Bearer ${req.session.accessToken}`,

                        "Content-Type":
                            "application/json"

                    }

                }

            );


            console.log(
                `${object} updated successfully!`
            );


            res.json({

                message:
                    "Record updated successfully"

            });


        } catch (error) {

            console.error(

                `Salesforce ${object} Update Error:`,

                error.response?.data ||
                error.message

            );


            res.status(500).json({

                message:
                    `Failed to update ${object}`,

                error:
                    error.response?.data ||
                    error.message

            });

        }

    }
);


// ======================================================
// DELETE RECORD
// ======================================================

app.delete(
    "/api/records/:object/:id",
    async (req, res) => {

        if (
            !req.session.accessToken ||
            !req.session.instanceUrl
        ) {

            return res.status(401).json({

                message:
                    "Not logged in to Salesforce"

            });

        }


        const {
            object,
            id
        } = req.params;


        if (
            !allowedObjects.includes(object)
        ) {

            return res.status(400).json({

                message:
                    "Invalid Salesforce object"

            });

        }


        try {

            await axios.delete(

                `${req.session.instanceUrl}/services/data/v65.0/sobjects/${object}/${id}`,

                {

                    headers: {

                        Authorization:
                            `Bearer ${req.session.accessToken}`

                    }

                }

            );


            console.log(
                `${object} deleted successfully:`,
                id
            );


            res.json({

                message:
                    "Record deleted successfully"

            });


        } catch (error) {

            console.error(

                `Salesforce ${object} Delete Error:`,

                error.response?.data ||
                error.message

            );


            res.status(500).json({

                message:
                    `Failed to delete ${object}`,

                error:
                    error.response?.data ||
                    error.message

            });

        }

    }
);


// ======================================================
// START SERVER
// ======================================================

app.listen(
    PORT,
    () => {

        console.log(
            `Backend server running on port ${PORT}`
        );

    }
);