require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const crypto = require("crypto");

const app = express();

let codeVerifier;
let accessToken;
let instanceUrl;

app.use(cors());
app.use(express.json());


// ======================================================
// SALESFORCE OBJECT CONFIGURATION
// ======================================================

const objectConfig = {

    Account: {
        // 5 fields displayed in table
        fields: [
            "Id",
            "Name",
            "Phone",
            "Website",
            "Industry",
            "Rating"
        ],

        // Fields user can enter
        createFields: [
            "Name",
            "Phone",
            "Website",
            "Industry",
            "Rating"
        ]
    },


    Opportunity: {
        // 6 fields displayed in table
        fields: [
            "Id",
            "Name",
            "Amount",
            "StageName",
            "CloseDate",
            "Probability",
            "Type"
        ],

        // Fields user can enter
        createFields: [
            "Name",
            "Amount",
            "StageName",
            "CloseDate",
            "Type"
        ]
    },


    Lead: {
        // 6 fields displayed in table
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
        // 6 fields displayed in table
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
        // 6 fields displayed in table
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

    codeVerifier = crypto
        .randomBytes(64)
        .toString("base64url");

    const codeChallenge = crypto
        .createHash("sha256")
        .update(codeVerifier)
        .digest("base64url");

    const authUrl =
        `${process.env.SF_LOGIN_URL}/services/oauth2/authorize` +
        `?response_type=code` +
        `&client_id=${encodeURIComponent(
            process.env.SF_CLIENT_ID
        )}` +
        `&redirect_uri=${encodeURIComponent(
            process.env.SF_CALLBACK_URL
        )}` +
        `&code_challenge=${encodeURIComponent(
            codeChallenge
        )}` +
        `&code_challenge_method=S256`;

    console.log(
        "Opening Salesforce login..."
    );

    res.redirect(authUrl);
});


// ======================================================
// SALESFORCE CALLBACK
// ======================================================

app.get(
    "/auth/callback",
    async (req, res) => {

        const { code } = req.query;

        if (!code) {

            return res
                .status(400)
                .send(
                    "Authorization code not received"
                );
        }

        try {

            const response =
                await axios.post(

                    `${process.env.SF_LOGIN_URL}/services/oauth2/token`,

                    new URLSearchParams({

                        grant_type:
                            "authorization_code",

                        code: code,

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


            accessToken =
                response.data.access_token;

            instanceUrl =
                response.data.instance_url;

            codeVerifier = null;


            console.log(
                "Salesforce login successful!"
            );

            console.log(
                "Instance URL:",
                instanceUrl
            );

            console.log(
                "Access Token received:",
                !!accessToken
            );


            res.redirect(
                "http://localhost:5174/"
            );

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
                !!accessToken,

            instance_url:
                instanceUrl || null

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
            !accessToken ||
            !instanceUrl
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
            !allowedObjects.includes(
                object
            )
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

                        `${instanceUrl}${nextUrl}`,

                        {

                            headers: {

                                Authorization:
                                    `Bearer ${accessToken}`

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

                        `${instanceUrl}/services/data/v65.0/query`,

                        {

                            params: {
                                q: query
                            },

                            headers: {

                                Authorization:
                                    `Bearer ${accessToken}`,
                                
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
            !accessToken ||
            !instanceUrl
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
            !allowedObjects.includes(
                object
            )
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

                    `${instanceUrl}/services/data/v65.0/sobjects/${object}`,

                    salesforceRecord,

                    {

                        headers: {

                            Authorization:
                                `Bearer ${accessToken}`,

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
            !accessToken ||
            !instanceUrl
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
            !allowedObjects.includes(
                object
            )
        ) {

            return res.status(400).json({

                message:
                    "Invalid Salesforce object"

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

                `${instanceUrl}/services/data/v65.0/sobjects/${object}/${id}`,

                salesforceRecord,

                {

                    headers: {

                        Authorization:
                            `Bearer ${accessToken}`,

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
            !accessToken ||
            !instanceUrl
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
            !allowedObjects.includes(
                object
            )
        ) {

            return res.status(400).json({

                message:
                    "Invalid Salesforce object"

            });

        }


        try {

            await axios.delete(

                `${instanceUrl}/services/data/v65.0/sobjects/${object}/${id}`,

                {

                    headers: {

                        Authorization:
                            `Bearer ${accessToken}`

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

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Server running on port ${PORT}`
    );
  }
);