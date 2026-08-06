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
    const config = window.SIMPRO_CONFIG || {};
    const baseUrl = String(config.baseUrl || "").trim();
    const authToken = String(config.authToken || "").trim();

    if (!baseUrl || !authToken) {
      const errorMessage = "SIMPRO configuration is missing.";
      console.error(errorMessage);
      if (typeof options?.onError === "function") {
        options.onError(null, "config_error", errorMessage);
      }
      return $.Deferred().reject(errorMessage);
    }

    const requestBody = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);

    const settings = {
      url: `${baseUrl}/companies/${window.SIMPRO_CONFIG.companyId}/quotes/`,
      method: "POST",
      timeout: 0,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      data: requestBody,
    };

    // Return a Promise that resolves only after custom fields and attachments are processed
    return new Promise(function (resolve, reject) {
      $.ajax(settings)
        .done(async function (response) {
          const quoteId = response?.ID || response?.Id || response?.id || response?.QuoteId || response?.quoteId;

          if (quoteId) {
            // Update custom fields
            updateQuoteCustomFields(quoteId, baseUrl, authToken)
              .done(function () {
                console.log("Quote custom fields updated successfully.");
              })
              .fail(function () {
                console.error("One or more quote custom field updates failed.");
              });

            // Create a quote section and then call catalog and labor APIs using the section ID
            if (options?.autoCreateSection || options?.catalogPayload || options?.laborPayload) {
              try {
                const sectionResult = await createQuoteSection(quoteId);
                const sectionId = extractEntityId(sectionResult.response);

                if (sectionId) {
                  console.log("Quote section created:", sectionId);

                  const costCenterId = Number(options?.costCenterId || 0);
                  const costCenterName = String(options?.costCenterName || "").trim();
                  let sectionCostCenterId = costCenterId;
                  const catalogPayload = options?.catalogPayload;
                  const laborPayload = options?.laborPayload;
                  const requestPromises = [];

                  if (costCenterId > 0 && costCenterName) {
                    try {
                      const costCenterResult = await createQuoteSectionCostCenter(quoteId, sectionId, costCenterId, costCenterName);
                      const createdCostCenterId = extractEntityId(costCenterResult.response);
                      if (createdCostCenterId) {
                        sectionCostCenterId = createdCostCenterId;
                        console.log("Quote section cost center created:", sectionCostCenterId);
                      } else {
                        console.warn("Quote section cost center creation did not return an ID; using original costCenterId.");
                      }
                    } catch (costCenterErr) {
                      console.error("Quote section cost center creation failed:", costCenterErr);
                      if (typeof options?.onCostCenterError === "function") {
                        options.onCostCenterError(costCenterErr);
                      }
                    }
                  }

                  const catalogPayloads = Array.isArray(options?.catalogPayload)
                    ? options.catalogPayload
                    : options?.catalogPayload
                      ? [options.catalogPayload]
                      : [];
                  const laborPayloads = Array.isArray(options?.laborPayload)
                    ? options.laborPayload
                    : options?.laborPayload
                      ? [options.laborPayload]
                      : [];

                  if (laborPayloads.length && sectionCostCenterId > 0) {
                    await createQuoteSectionCostCenterLabor(quoteId, sectionId, sectionCostCenterId, laborPayloads)
                      .then((laborResult) => {
                        console.log("Quote labor created:", laborResult);
                        if (typeof options?.onLaborSuccess === "function") {
                          options.onLaborSuccess(laborResult);
                        }
                      })
                      .catch((laborErr) => {
                        console.error("Quote labor creation failed:", laborErr);
                        if (typeof options?.onLaborError === "function") {
                          options.onLaborError(laborErr);
                        }
                      });

                    await new Promise((resolve) => setTimeout(resolve, 1000));
                  }

                  if (catalogPayloads.length && sectionCostCenterId > 0) {
                    await createQuoteSectionCatalog(quoteId, sectionId, sectionCostCenterId, catalogPayloads)
                      .then((catalogResult) => {
                        console.log("Quote catalog created:", catalogResult);
                        if (typeof options?.onCatalogSuccess === "function") {
                          options.onCatalogSuccess(catalogResult);
                        }
                      })
                      .catch((catalogErr) => {
                        console.error("Quote catalog creation failed:", catalogErr);
                        if (typeof options?.onCatalogError === "function") {
                          options.onCatalogError(catalogErr);
                        }
                      });
                  }
                } else {
                  console.warn("Quote section response did not return a section ID.");
                }
              } catch (sectionErr) {
                console.error("Quote section creation failed:", sectionErr);
                if (typeof options?.onSectionError === "function") {
                  options.onSectionError(sectionErr);
                }
              }
            }

            // If options provided, allow caller to pass photos/pdf arrays
            try {
              const photos = Array.isArray(options?.photos) ? options.photos : [];
              const pdfFile = options?.pdfFile || null;

              // Upload photos first (if any)
              if (photos.length && typeof window.uploadQuoteAttachments === "function") {
                await uploadQuoteAttachments(quoteId, photos, {
                  onComplete: function () {
                    console.log("Quote photos uploaded successfully.");
                  },
                  onError: function (err) {
                    console.error("Quote photo upload failed:", err);
                  },
                });
              }

              // Upload PDF if provided
              if (pdfFile && typeof uploadQuoteAttachment === "function") {
                await uploadQuoteAttachment(quoteId, pdfFile, {
                  onComplete: function () {
                    console.log("Quote PDF uploaded successfully.");
                  },
                  onError: function (err) {
                    console.error("Quote PDF upload failed:", err);
                  },
                });
              }
            } catch (err) {
              console.error("Error uploading quote attachments:", err);
            }
          }

          if (typeof options?.onSuccess === "function") {
            try {
              options.onSuccess(response);
            } catch (e) {
              // swallow
            }
          }

          resolve(response);
        })
        .fail(function (xhr, status, error) {
          if (typeof options?.onError === "function") {
            try {
              options.onError(xhr, status, error);
            } catch (e) {}
          }
          console.error("Quote submission failed:", status, error, xhr);
          reject({ xhr, status, error });
        });
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
