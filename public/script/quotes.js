(function ($) {
  // Read a File object as Base64 (returns Promise)
  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function () {
        const result = reader.result;
        if (typeof result === "string") {
          const base64Data = result.includes(",") ? result.split(",")[1] : result;
          resolve(base64Data);
        } else {
          reject(new Error("Unable to read file as Base64."));
        }
      };
      reader.onerror = function () {
        reject(reader.error || new Error("Failed to read file."));
      };
      reader.readAsDataURL(file);
    });
  }

  function updateQuoteCustomFields(quoteId, baseUrl, authToken) {
    if (!quoteId) {
      return $.Deferred().reject(new Error("Quote ID is missing.")).promise();
    }

    try {
      const userData = localStorage.getItem("user");
      const user = JSON.parse(userData || "{}");

      const customFields = [
        { id: 7, value: "QUOTE Request - LEAD Form" },
        { id: 4, value: user.Name || "" },
        { id: 6, value: user.col3 || "" },
        { id: 5, value: user.TeamName || "" },
      ];

      const requests = customFields.map((field) => {
        return $.ajax({
          url: `${baseUrl}/companies/${window.SIMPRO_CONFIG.companyId}/quotes/${quoteId}/customFields/${field.id}`,
          method: "PATCH",
          timeout: 0,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          data: JSON.stringify({ Value: field.value }),
        });
      });

      return $.when.apply($, requests);
    } catch (err) {
      return $.Deferred().reject(err).promise();
    }
  }

  function uploadQuoteAttachment(quoteId, file, options) {
    const config = window.SIMPRO_CONFIG || {};
    const baseUrl = String(config.baseUrl || "").trim();
    const authToken = String(config.authToken || "").trim();
    const companyId = Number(config.companyId || 6) || 6;

    if (!quoteId) {
      return Promise.reject(new Error("Quote ID is required for attachment upload."));
    }

    if (!baseUrl || !authToken) {
      return Promise.reject(new Error("SIMPRO configuration is missing."));
    }

    return readFileAsBase64(file).then((base64Data) => {
      const payload = {
        Filename: String(file.name || "attachment").trim() || "attachment",
        Base64Data: base64Data,
        Public: false,
        Email: true,
      };

      const settings = {
        url: `${baseUrl}/companies/${window.SIMPRO_CONFIG.companyId}/quotes/${quoteId}/attachments/files/`,
        method: "POST",
        timeout: 0,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: JSON.stringify(payload),
      };

      return $.ajax(settings).then((response) => ({ response, file, quoteId }));
    });
  }

  function uploadQuoteAttachments(quoteId, files, options) {
    const photoFiles = Array.isArray(files) ? files : [];
    if (!photoFiles.length) {
      return Promise.resolve([]);
    }

    return Promise.all(
      photoFiles.map((file) =>
        uploadQuoteAttachment(quoteId, file, options).catch((err) => {
          if (typeof options?.onError === "function") {
            options.onError(err, file);
          }
          return Promise.reject(err);
        }),
      ),
    ).then((results) => {
      if (typeof options?.onComplete === "function") {
        options.onComplete(results);
      }
      return results;
    });
  }

  function createQuoteSection(quoteId) {
    const config = window.SIMPRO_CONFIG || {};
    const baseUrl = String(config.baseUrl || "").trim();
    const authToken = String(config.authToken || "").trim();
    const companyId = Number(config.companyId || 6) || 6;

    if (!quoteId) {
      return Promise.reject(new Error("Quote ID is required to create a section."));
    }

    if (!baseUrl || !authToken) {
      return Promise.reject(new Error("SIMPRO configuration is missing."));
    }

    const settings = {
      url: `${baseUrl}/companies/${companyId}/quotes/${quoteId}/sections/`,
      method: "POST",
      timeout: 0,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      data: JSON.stringify({}),
    };

    return $.ajax(settings).then((response) => ({ response, quoteId }));
  }

  function createQuoteSectionCostCenter(quoteId, sectionId, costCenterId, name) {
    const config = window.SIMPRO_CONFIG || {};
    const baseUrl = String(config.baseUrl || "").trim();
    const authToken = String(config.authToken || "").trim();
    const companyId = Number(config.companyId || 6) || 6;

    if (!quoteId || !sectionId || !costCenterId) {
      return Promise.reject(new Error("Quote ID, section ID, and cost center ID are required to create a section cost center."));
    }

    if (!baseUrl || !authToken) {
      return Promise.reject(new Error("SIMPRO configuration is missing."));
    }

    const payload = {
      CostCenter: Number(costCenterId) || 0,
      Name: String(name || "").trim(),
    };

    const settings = {
      url: `${baseUrl}/companies/${companyId}/quotes/${quoteId}/sections/${sectionId}/costCenters/`,
      method: "POST",
      timeout: 0,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      data: JSON.stringify(payload),
    };

    return $.ajax(settings).then((response) => ({ response, quoteId, sectionId, costCenterId, name }));
  }

  function createQuoteSectionCatalog(quoteId, sectionId, costCenterId, payload) {
    const config = window.SIMPRO_CONFIG || {};
    const baseUrl = String(config.baseUrl || "").trim();
    const authToken = String(config.authToken || "").trim();
    const companyId = Number(config.companyId || 6) || 6;

    if (!quoteId || !sectionId || !costCenterId) {
      return Promise.reject(new Error("Quote ID, section ID, and cost center ID are required to create a catalog entry."));
    }

    if (!baseUrl || !authToken) {
      return Promise.reject(new Error("SIMPRO configuration is missing."));
    }

    const isArrayPayload = Array.isArray(payload);
    const settings = {
      url: `${baseUrl}/companies/${companyId}/quotes/${quoteId}/sections/${sectionId}/costCenters/${costCenterId}/catalogs/`,
      method: isArrayPayload ? "PUT" : "POST",
      timeout: 0,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      data: JSON.stringify(payload || {}),
    };

    return $.ajax(settings).then((response) => ({ response, quoteId, sectionId, costCenterId }));
  }

  function createQuoteSectionCostCenterLabor(quoteId, sectionId, costCenterId, payload) {
    const config = window.SIMPRO_CONFIG || {};
    const baseUrl = String(config.baseUrl || "").trim();
    const authToken = String(config.authToken || "").trim();
    const companyId = Number(config.companyId || 6) || 6;

    if (!quoteId || !sectionId || !costCenterId) {
      return Promise.reject(new Error("Quote ID, section ID, and cost center ID are required to create labor."));
    }

    if (!baseUrl || !authToken) {
      return Promise.reject(new Error("SIMPRO configuration is missing."));
    }

    const isArrayPayload = Array.isArray(payload);
    const settings = {
      url: `${baseUrl}/companies/${companyId}/quotes/${quoteId}/sections/${sectionId}/costCenters/${costCenterId}/labor/`,
      method: isArrayPayload ? "PUT" : "POST",
      timeout: 0,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      data: JSON.stringify(payload || {}),
    };

    return $.ajax(settings).then((response) => ({ response, quoteId, sectionId, costCenterId }));
  }

  // Fetch labor rates on page load and expose helper to resolve LaborType IDs
  function fetchLaborRates() {
    const config = window.SIMPRO_CONFIG || {};
    const baseUrl = String(config.baseUrl || "").trim();
    const authToken = String(config.authToken || "").trim();
    const companyId = Number(config.companyId || 6) || 6;

    if (!baseUrl || !authToken) {
      return Promise.reject(new Error("SIMPRO configuration is missing for labor rates."));
    }

    const url = `${baseUrl}/companies/${companyId}/setup/labor/laborRates/?search=any&pageSize=100&page=1&limit=100`;

    return $.ajax({
      url,
      method: "GET",
      timeout: 0,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((resp) => {
        const map = {};
        if (Array.isArray(resp)) {
          resp.forEach((r) => {
            if (r && r.Name) {
              map[String(r.Name).trim().toLowerCase()] = Number(r.ID || r.Id || r.id || 0) || 0;
            }
          });
        }
        window.LABOR_RATE_MAP = map;
        window.getLaborTypeId = function (roleName, isOvertime) {
          const keyBase = String(roleName || "").trim().toLowerCase();
          if (isOvertime) {
            const otKey = `${keyBase} - overtime`;
            if (map[otKey]) return map[otKey];
            // also try variants
            if (map[`${keyBase} - ot`]) return map[`${keyBase} - ot`];
          }
          return map[keyBase] || 0;
        };

        return map;
      })
      .catch((err) => {
        console.error("Failed to fetch labor rates:", err);
        window.LABOR_RATE_MAP = window.LABOR_RATE_MAP || {};
        window.getLaborTypeId = window.getLaborTypeId || function () { return 0; };
        return window.LABOR_RATE_MAP;
      });
  }

  // auto-fetch on load
  $(function () {
    if (typeof window.fetchLaborRates !== "function") {
      window.fetchLaborRates = fetchLaborRates;
    }
    window.fetchLaborRates();
  });

  function buildQuoteCatalogPayload(options) {
    const opts = options || {};

    return {
      Catalog: Number(opts.Catalog || 0),
      Total: {
        Qty: Number(opts.Total?.Qty || 0),
      },
      BillableItem: Boolean(opts.BillableItem || false),
      BillableStatus: String(opts.BillableStatus || "").trim(),
      EstimatedTime: Number(opts.EstimatedTime || 0),
      FitTime: Number(opts.FitTime || 0),
      BasePrice: Number(opts.BasePrice || 0),
      Markup: Number(opts.Markup || 0),
      SalesTaxCode: Number(opts.SalesTaxCode || 0),
      DisplayOrder: Number(opts.DisplayOrder || 0),
      Discount: Number(opts.Discount || 0),
      SellPriceExDiscount: Number(opts.SellPriceExDiscount || 0),
      SellPriceIncDiscount: Number(opts.SellPriceIncDiscount || 0),
      SellPrice: Number(opts.SellPrice || 0),
      IncomeAccount: Number(opts.IncomeAccount || 0),
    };
  }

  function extractEntityId(response) {
    return Number(response?.ID || response?.Id || response?.id || 0) || 0;
  }

  function buildQuoteLaborPayload(options) {
    const opts = options || {};

    return {
      LaborType: Number(opts.LaborType || 0),
      Total: {
        Qty: Number(opts.Total?.Qty || 0),
      },
      LaborRate: Number(opts.LaborRate || 0),
      LaborMarkup: Number(opts.LaborMarkup || 0),
      SalesTaxCode: Number(opts.SalesTaxCode || 0),
      Discount: Number(opts.Discount || 0),
      SellPriceExDiscount: Number(opts.SellPriceExDiscount || 0),
      SellPriceIncDiscount: Number(opts.SellPriceIncDiscount || 0),
      IncomeAccount: Number(opts.IncomeAccount || 0),
    };
  }

  function createQuoteSectionAndCostCenterJobs(quoteId, sectionId, costCenterId, catalogPayload, laborPayload) {
    return createQuoteSectionCatalog(quoteId, sectionId, costCenterId, catalogPayload)
      .then((catalogResult) => {
        return createQuoteSectionCostCenterLabor(quoteId, sectionId, costCenterId, laborPayload)
          .then((laborResult) => ({ catalogResult, laborResult }));
      });
  }

  function submitQuoteToSimpro(payload, options) {
    const simproEnv = window.localStorage?.getItem("SIMPRO_ENV") || "PROD";
    const requestBody = {
      quoteData: payload,
      options: options || {},
      simproEnv,
    };

    return $.ajax({
      url: "/api/quote",
      method: "POST",
      timeout: 0,
      contentType: "application/json",
      dataType: "json",
      data: JSON.stringify(requestBody),
    })
      .done(function (response) {
        if (typeof options?.onSuccess === "function") {
          options.onSuccess(response.data || response);
          return;
        }
      })
      .fail(function (xhr, status, error) {
        if (typeof options?.onError === "function") {
          options.onError(xhr, status, error);
          return;
        }

        if (typeof showApiErrorDialog === "function") {
          showApiErrorDialog(xhr, status, error, "Quote creation failed");
          return;
        }

        console.error("Quote submission failed:", status, error, xhr);
      });
  }

  // Expose functions
  window.submitQuoteToSimpro = submitQuoteToSimpro;
  window.uploadQuoteAttachments = uploadQuoteAttachments;
  window.uploadQuoteAttachment = uploadQuoteAttachment;
  window.updateQuoteCustomFields = updateQuoteCustomFields;
  window.createQuoteSection = createQuoteSection;
  window.createQuoteSectionCatalog = createQuoteSectionCatalog;
  window.createQuoteSectionCostCenterLabor = createQuoteSectionCostCenterLabor;
  window.buildQuoteCatalogPayload = buildQuoteCatalogPayload;
  window.buildQuoteContractorJobPayload = buildQuoteCatalogPayload; // alias for compatibility
  window.buildQuoteLaborPayload = buildQuoteLaborPayload;
  window.createQuoteSectionAndCostCenterJobs = createQuoteSectionAndCostCenterJobs;
})(jQuery);
