const nodemailer = require("nodemailer");
const axios = require("axios");

const SIMPRO_CONFIGS = {
  UAT: {
    baseUrl:
      process.env.SIMPRO_UAT_BASE_URL ||
      process.env.SIMPRO_BASE_URL ||
      "https://excel-uat.simprocloud.com/api/v1.0",
    authToken:
      process.env.SIMPRO_AUTH_TOKEN_UAT ||
      process.env.SIMPRO_AUTH_TOKEN ||
      "4eaf76846bcaf8104343397586480856b8a34f7c",
    companyId: process.env.SIMPRO_COMPANY_ID ? Number(process.env.SIMPRO_COMPANY_ID) : 6,
  },
  PROD: {
    baseUrl:
      process.env.SIMPRO_PROD_BASE_URL ||
      process.env.SIMPRO_BASE_URL ||
      "https://excel.simprocloud.com/api/v1.0",
    authToken:
      process.env.SIMPRO_AUTH_TOKEN_PROD ||
      process.env.SIMPRO_AUTH_TOKEN ||
      "c9c47eab18f514ad102ae8c78ce2a444e3bc4dab",
    companyId: process.env.SIMPRO_COMPANY_ID ? Number(process.env.SIMPRO_COMPANY_ID) : 6,
  },
};

function getSimproConfig(env) {
  const key = String(env || process.env.SIMPRO_ENV || "PROD").trim().toUpperCase();
  return SIMPRO_CONFIGS[key] || SIMPRO_CONFIGS.PROD;
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "akeetek01@gmail.com",
        pass: "ezdbjjeavwavxsai"
    }
});

exports.dashboard = (req, res) => {
    res.json({ message: "Excel Protected API" });
};

exports.getSimproEmployees = async (req, res) => {
  const { baseUrl, authToken, companyId } = getSimproConfig(req.query.env);
  if (!authToken) {
    return res.status(503).json({ error: "Simpro access token is not configured on the server" });
  }

  try {
    const response = await axios.get(`${baseUrl}/companies/${companyId}/employees/`, {
      params: {
        search: "all",
        columns: "ID,Name,Position,PrimaryContact",
        pageSize: 250,
        page: 1,
        limit: 100
      },
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`
      },
      timeout: 15000
    });
    return res.json(response.data);
  } catch (error) {
    console.error("Simpro employee request failed:", error.response?.status || error.message);
    return res.status(error.response?.status || 502).json({ error: "Unable to retrieve employees from Simpro" });
  }
};

exports.getSimproTeams = async (req, res) => {
  const { baseUrl, authToken, companyId } = getSimproConfig(req.query.env);
  if (!authToken) {
    return res.status(503).json({ error: "Simpro access token is not configured on the server" });
  }

  try {
    const response = await axios.get(`${baseUrl}/companies/${companyId}/setup/teams/`, {
      params: {
        search: "any",
        pageSize: 250,
        page: 1,
        limit: 100
      },
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`
      },
      timeout: 15000
    });
    return res.json(response.data);
  } catch (error) {
    console.error("Simpro team request failed:", error.response?.status || error.message);
    return res.status(error.response?.status || 502).json({ error: "Unable to retrieve teams from Simpro" });
  }
};

const db = require("../firebase");
const { ref, set, get, child, update } = require("firebase/database");

exports.registerUser = async (req, res) => {
     //res.json({ message: "Excel Protected API" });
        console.log(`${req.method} ${req.url}`);

    const { name, email, password, phone } = req.body;
    console.log("Received registration data:", { name, email, password: password ? "****" : undefined, phone: phone ? "****" : undefined });
    if (!name || !email || !password || !phone) {
        return res.status(400).json({ error: "All fields are required" });
    }
    const userId = Date.now();
    try {
        await set(ref(db, `employees/${userId}`), { name, email, password, phone });
        res.json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ error: "Error registering user" });
    }
};

exports.getUsers = async (req, res) => {
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'employees'));
        if (snapshot.exists()) {
            res.json(snapshot.val());
        } else {
            res.json({});
        }
    } catch (err) {
        res.status(500).json({ error: "Error fetching employees" });
    }
};

exports.getUsersByEmail = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'employees'));
        if (snapshot.exists()) {
            let user = null;
            snapshot.forEach(childSnap => {
                const userData = childSnap.val();
                if (userData.Email === email) {
                    user = userData;
                }
            });
            if (user) {
                res.json(user);
            } else {
                res.status(404).json({ error: "User not found" });
            }
        } else {
            res.status(404).json({ error: "Users not found" });
        }
    } catch (err) {
        res.status(500).json({ error: "Error fetching user" });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'employees'));
        if (snapshot.exists()) {
            let found = false;
            let currentUser = null;
            snapshot.forEach(childSnap => {
                const user = childSnap.val();
                if (user.Email === email && user.Password === password) {
                    found = true;
                    currentUser = user;
                }
            });
            if (found) {
                return res.json({ message: "Login successful", user: currentUser });
            }
        }
        res.status(401).json({ error: "Invalid credentials" });
    } catch (err) {
        res.status(500).json({ error: "Error logging in" });
    }
};


exports.changePassword = async (req, res) => {
    
    const { email, oldPassword, newPassword, isTemp } = req.body;
    console.log("Request Body:", req.body);

    if (!email || !oldPassword || !newPassword) {
        return res.status(400).json({
            error: "Email, old/temp password and new password are required"
        });
    }

    try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, "employees"));

        if (!snapshot.exists()) {
            return res.status(404).json({
                error: "Users not found"
            });
        }

        let userKey = null;

        snapshot.forEach((childSnap) => {
            const user = childSnap.val();
            if (isTemp === true || isTemp === "true") {
                if (
                    user.Email === email &&
                    user.tempPassword === oldPassword
                ) {
                    userKey = childSnap.key;
                }
            } else {
                if (
                    user.Email === email &&
                    user.Password === oldPassword
                ) {
                    userKey = childSnap.key;
                }
            }
        });

        if (!userKey) {
            return res.status(401).json({
                error: "Pasword mismatch"
            });
        }

        await update(ref(db, `employees/${userKey}`), {
            Password: newPassword,
            isAccountActive: true,
            modifiedDate: new Date().toISOString(),
            tempPassword: null
        });

        return res.status(200).json({
            message: "Password updated successfully"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Failed to update password"
        });
    }
};

exports.insertScript = async (req, res) => {
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'InsertScript'));
        if (snapshot.exists()) {
            res.json(snapshot.val());
        } else {
            res.json({});
        }
    } catch (err) {
        res.status(500).json({ error: "Error fetching InsertScript" });
    }
};

exports.updateUser = async (req, res) => {  
      const { email, isAccountActive, tempPassword } = req.body;
      if (!email) {
        return res.status(400).json({
            error: "Email is required"
        });
    }

    try {

        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, "employees"));

        if (!snapshot.exists()) {
            return res.status(404).json({
                error: "Users not found"
            });
        }

        let userKey = null;

        snapshot.forEach((childSnap) => {

            const user = childSnap.val();

            if (user.Email === email) {
                userKey = childSnap.key;
            }

        });

        if (!userKey) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        await update(ref(db, `employees/${userKey}`), {
            modifiedDate: new Date().toISOString(),
            isAccountActive: isAccountActive,
            tempPassword: tempPassword
        });

        return res.json({
            success: true,
            message: "User updated successfully."
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: err.message
        });

    }
}







exports.sendEmail = async (req, res) => {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            error: "Name, Email and Password are required."
        });
    }

    const html = `
    <!DOCTYPE html>
    <html>

    <head>
        <style>
            body {
                font-family: Arial;
                background: #f4f4f4;
                padding: 20px;
            }

            .container {
                max-width: 600px;
                margin: auto;
                background: #fff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 0 8px rgba(0,0,0,.15);
            }

            .header {
                background: #0d6efd;
                color: white;
                padding: 20px;
                text-align: center;
            }

            .content {
                padding: 30px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }

            td {
                border: 1px solid #ddd;
                padding: 10px;
            }

            .btn {
                display: inline-block;
                background: #0d6efd;
                color: white !important;
                padding: 12px 25px;
                text-decoration: none;
                border-radius: 5px;
            }

            .footer {
                text-align: center;
                color: gray;
                padding: 20px;
            }
        </style>
    </head>

    <body>

        <div class="container">

            <div class="header">
                <h2>Welcome</h2>
            </div>

            <div class="content">

                <p>Hello <b>${name}</b>,</p>

                <p>Your account has been created successfully.</p>

                <table>

                    <tr>
                        <td><b>Email</b></td>
                        <td>${email}</td>
                    </tr>

                    <tr>
                        <td><b>Password</b></td>
                        <td>${password}</td>
                    </tr>

                </table>

                <p>
                    <a class="btn"
                       href="https://excel--excel-292de.us-east4.hosted.app/login?email=${encodeURIComponent(email)}&tempPw=${encodeURIComponent(password)}&isTemp=true">
                       Change Password
                    </a>
                </p>

                <p>Please change your password after your first login.</p>

            </div>

            <div class="footer">
                © 2026 Excel. All rights reserved.
            </div>

        </div>

    </body>

    </html>
    `;

    try {

        await transporter.sendMail({
            from: '"Support Team" <akeetek01@gmail.com>',
            to: email,
            subject: "Welcome to Excel",
            html: html
        });

        res.json({
            success: true,
            message: `Verification code sent to ${email}. Please check your inbox.`
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

};

async function patchLeadCustomFields(jobData, leadId, simproConfig) {
  const customFields = Array.isArray(jobData.customFields)
    ? jobData.customFields
    : [];

  if (!customFields.length) {
    return;
  }

  const requests = customFields.map((field) => {
    const fieldId =
      Number(field.CustomField || field.id || field.ID || field.Id || 0) || 0;
    const fieldValue = field.Value ?? field.value ?? "";

    if (!fieldId) {
      return Promise.resolve();
    }

    const url = `${simproConfig.baseUrl}/companies/${simproConfig.companyId}/leads/${leadId}/customFields/${fieldId}`;
    return axios.request({
      method: "patch",
      url,
      data: JSON.stringify({ Value: fieldValue }),
      headers: {
        Authorization: `Bearer ${simproConfig.authToken}`,
        "Content-Type": "application/json",
      },
    });
  });

  const results = await Promise.allSettled(requests);
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Lead custom field ${index} failed for lead ${leadId}:`,
        result.reason,
      );
    }
  });
}

async function uploadLeadAttachments(jobData, leadId, simproConfig) {
  const attachments = Array.isArray(jobData.attachments)
    ? jobData.attachments
    : [];

  if (!attachments.length) {
    return;
  }

  const validAttachments = attachments.filter((attachment) =>
    String(attachment.base64 || "").trim(),
  );

  if (!validAttachments.length) {
    return;
  }

  const requests = validAttachments.map((attachment, index) => {
    const base64 = String(attachment.base64 || "").trim();
    const fileName = String(attachment.fileName || "attachment");

    const payload = {
      Filename: fileName,
      Base64Data: base64,
      Public: false,
      Email: true,
    };

    const url = `${simproConfig.baseUrl}/companies/${simproConfig.companyId}/leads/${leadId}/attachments/files/`;
    return axios
      .post(url, payload, {
        headers: {
          Authorization: `Bearer ${simproConfig.authToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((resp) => resp.data)
      .catch((error) => {
        const responseText = error.response?.data || error.message;
        throw new Error(
          `Attachment upload failed for ${fileName}: ${responseText}`,
        );
      });
  });

  const results = await Promise.allSettled(requests);
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Lead attachment ${index} failed for lead ${leadId}:`,
        result.reason,
      );
    }
  });
}

async function processLeadBackgroundTasks(jobData, leadId, simproConfig) {
  try {
    await Promise.all([
      patchLeadCustomFields(jobData, leadId, simproConfig),
      uploadLeadAttachments(jobData, leadId, simproConfig),
    ]);
  } catch (err) {
    console.error(`Background lead processing failed for lead ${leadId}:`, err);
  }
}

// async function patchQuoteCustomFields(quoteId, customFields) {
//   if (!quoteId || !Array.isArray(customFields) || !customFields.length) {
//     return;
//   }
//
//   const requests = customFields.map((field) => {
//     const fieldId =
//       Number(field.CustomField || field.id || field.ID || field.Id || 0) || 0;
//     const fieldValue = field.Value ?? field.value ?? "";
//
//     if (!fieldId) {
//       return Promise.resolve();
//     }
//
//     const url = `${SIMPRO_CONFIG.baseUrl}/companies/${SIMPRO_CONFIG.companyId}/quotes/${quoteId}/customFields/${fieldId}`;
//     return axios.request({
//       method: "patch",
//       url,
//       data: JSON.stringify({ Value: fieldValue }),
//       headers: {
//         Authorization: `Bearer ${SIMPRO_CONFIG.authToken}`,
//         "Content-Type": "application/json",
//       },
//     });
//   });
//
//   const results = await Promise.allSettled(requests);
//   results.forEach((result, index) => {
//     if (result.status === "rejected") {
//       console.error(
//         `Quote custom field ${index} failed for quote ${quoteId}:`,
//         result.reason,
//       );
//     }
//   });
// }

async function createQuoteSection(quoteId, simproConfig) {
  const url = `${simproConfig.baseUrl}/companies/${simproConfig.companyId}/quotes/${quoteId}/sections/`;
  const response = await axios.post(
    url,
    {},
    {
      headers: {
        Authorization: `Bearer ${simproConfig.authToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );
  return response.data;
}

async function createQuoteSectionCostCenter(quoteId, sectionId, costCenterId, name, simproConfig) {
  if (!quoteId || !sectionId || !costCenterId) {
    return null;
  }

  const url = `${simproConfig.baseUrl}/companies/${simproConfig.companyId}/quotes/${quoteId}/sections/${sectionId}/costCenters/`;
  const payload = {
    CostCenter: Number(costCenterId) || 0,
    Name: String(name || "").trim(),
  };

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${simproConfig.authToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  return response.data;
}

async function createQuoteSectionCatalog(quoteId, sectionId, costCenterId, payload, simproConfig) {
  if (!quoteId || !sectionId || !costCenterId || !payload) {
    return null;
  }

  const url = `${simproConfig.baseUrl}/companies/${simproConfig.companyId}/quotes/${quoteId}/sections/${sectionId}/costCenters/${costCenterId}/catalogs/`;
  const isArrayPayload = Array.isArray(payload);
  const method = isArrayPayload ? "put" : "post";

  const response = await axios[method](url, payload, {
    headers: {
      Authorization: `Bearer ${simproConfig.authToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  return response.data;
}

async function createQuoteSectionCostCenterLabor(quoteId, sectionId, costCenterId, payload, simproConfig) {
  if (!quoteId || !sectionId || !costCenterId || !payload) {
    return null;
  }

  const url = `${simproConfig.baseUrl}/companies/${simproConfig.companyId}/quotes/${quoteId}/sections/${sectionId}/costCenters/${costCenterId}/labor/`;
  const isArrayPayload = Array.isArray(payload);
  const method = isArrayPayload ? "put" : "post";

  const response = await axios[method](url, payload, {
    headers: {
      Authorization: `Bearer ${simproConfig.authToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  return response.data;
}

async function uploadQuoteAttachment(quoteId, attachment, simproConfig) {
  const base64 = String(attachment.base64 || attachment.Base64Data || "").trim();
  const fileName = String(attachment.fileName || attachment.Filename || "attachment");

  if (!quoteId || !base64) {
    return null;
  }

  const payload = {
    Filename: fileName,
    Base64Data: base64,
    Public: false,
    Email: true,
  };

  const url = `${simproConfig.baseUrl}/companies/${simproConfig.companyId}/quotes/${quoteId}/attachments/files/`;
  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${simproConfig.authToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  return response.data;
}

async function uploadQuoteAttachments(quoteId, attachments, simproConfig) {
  const quoteAttachments = Array.isArray(attachments) ? attachments : [];
  if (!quoteAttachments.length) {
    return;
  }

  const requests = quoteAttachments.map((attachment) =>
    uploadQuoteAttachment(quoteId, attachment, simproConfig),
  );

  const results = await Promise.allSettled(requests);
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Quote attachment ${index} failed for quote ${quoteId}:`,
        result.reason,
      );
    }
  });
}

async function processQuoteBackgroundTasks(quoteData, options, quoteId, simproConfig) {
  try {
    await Promise.all([
      (async () => {
        if (!quoteId) return null;
        return null;
      })(),
      (async () => {
        if (!quoteId) return null;

        if (options?.autoCreateSection || options?.catalogPayload || options?.laborPayload) {
          const sectionResult = await createQuoteSection(quoteId, simproConfig);
          const sectionId = sectionResult?.ID || sectionResult?.Id || sectionResult?.id || 0;
          if (!sectionId) {
            return null;
          }

          let sectionCostCenterId = Number(options?.costCenterId || 0) || 0;
          const costCenterName = String(options?.costCenterName || "").trim();

          if (sectionCostCenterId > 0 && costCenterName) {
            const costCenterResult = await createQuoteSectionCostCenter(
              quoteId,
              sectionId,
              sectionCostCenterId,
              costCenterName,
              simproConfig,
            );
            const createdCostCenterId =
              Number(costCenterResult?.ID || costCenterResult?.Id || costCenterResult?.id || 0) || 0;
            if (createdCostCenterId) {
              sectionCostCenterId = createdCostCenterId;
            }
          }

          if (options?.laborPayload && sectionCostCenterId > 0) {
            await createQuoteSectionCostCenterLabor(
              quoteId,
              sectionId,
              sectionCostCenterId,
              options.laborPayload,
              simproConfig,
            );
            // small delay to give backend time to process cost center labour before adding catalog
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }

          if (options?.catalogPayload && sectionCostCenterId > 0) {
            await createQuoteSectionCatalog(
              quoteId,
              sectionId,
              sectionCostCenterId,
              options.catalogPayload,
              simproConfig,
            );
          }
        }
      })(),
      uploadQuoteAttachments(quoteId, options?.attachments || quoteData?.attachments, simproConfig),
    ]);
  } catch (err) {
    console.error(`Background quote processing failed for quote ${quoteId}:`, err);
  }
}

function extractLeadPayload(jobData) {
  if (!jobData || typeof jobData !== "object") {
    return {};
  }

  // Keep all jobData fields except attachments and customFields
  const { attachments, customFields, ...payload } = jobData;
  return payload;
}

exports.submitLeadToSimpro = async (req, res) => {
  try {
    const jobData = req.body?.jobData;
    const simproConfig = getSimproConfig(req.body?.simproEnv);

    if (!jobData || typeof jobData !== "object") {
      return res.status(400).json({ error: "jobData is required in the request body." });
    }

    const leadPayload = extractLeadPayload(jobData);
    const url = `${simproConfig.baseUrl}/companies/${simproConfig.companyId}/leads/`;
    const response = await axios.post(url, leadPayload, {
      headers: {
        Authorization: `Bearer ${simproConfig.authToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const simproResponse = response?.data ?? response;
    const leadId = simproResponse?.ID || simproResponse?.Id || simproResponse?.id || simproResponse?.LeadId || simproResponse?.leadId;

    if (leadId) {
      void processLeadBackgroundTasks(jobData, leadId, simproConfig);
    }

    return res.status(200).json(simproResponse);
  } catch (err) {
    console.error("Lead creation middleware error:", err);
    const statusCode = err.response?.status || 500;
    const errorBody = err.response?.data || err.message || "Lead creation failed.";
    return res.status(statusCode).json({ error: errorBody });
  }
};

exports.submitQuoteToSimpro = async (req, res) => {
  try {
    const quoteData = req.body?.quoteData;
    const options = req.body?.options || {};
    const simproConfig = getSimproConfig(req.body?.simproEnv);

    if (!quoteData || typeof quoteData !== "object") {
      return res.status(400).json({ error: "quoteData is required in the request body." });
    }

    const url = `${simproConfig.baseUrl}/companies/${simproConfig.companyId}/quotes/`;
    const response = await axios.post(url, quoteData, {
      headers: {
        Authorization: `Bearer ${simproConfig.authToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const simproResponse = response?.data ?? response;
    const quoteId =
      simproResponse?.ID || simproResponse?.Id || simproResponse?.id || simproResponse?.QuoteId || simproResponse?.quoteId;

    if (quoteId) {
      void processQuoteBackgroundTasks(quoteData, options, quoteId, simproConfig);
    }

    return res.status(200).json(simproResponse);
  } catch (err) {
    console.error("Quote creation middleware error:", err);
    const statusCode = err.response?.status || 500;
    const errorBody = err.response?.data || err.message || "Quote creation failed.";
    return res.status(statusCode).json({ error: errorBody });
  }
};