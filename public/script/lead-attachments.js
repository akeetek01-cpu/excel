(function ($) {
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

  function uploadLeadAttachment(leadId, file, options) {
    const config = window.SIMPRO_CONFIG || {};
    const baseUrl = String(config.baseUrl || "").trim();
    const authToken = String(config.authToken || "").trim();
    const companyId = Number(config.companyId || 6) || 6;

    if (!leadId) {
      return Promise.reject(new Error("Lead ID is required for attachment upload."));
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
        url: `${baseUrl}/companies/${companyId}/leads/${leadId}/attachments/files/`,
        method: "POST",
        timeout: 0,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: JSON.stringify(payload),
      };

      return $.ajax(settings).then((response) => ({ response, file, leadId }));
    });
  }

  function uploadLeadAttachments(leadId, files, options) {
    const fileList = Array.isArray(files) ? files.filter(Boolean) : [];

    if (!fileList.length) {
      if (typeof options?.onComplete === "function") {
        options.onComplete([], leadId);
      }
      return Promise.resolve([]);
    }

    const uploadPromises = fileList.map((file) => uploadLeadAttachment(leadId, file, options));

    return Promise.all(uploadPromises)
      .then((results) => {
        if (typeof options?.onComplete === "function") {
          options.onComplete(results, leadId);
        }
        return results;
      })
      .catch((error) => {
        console.error("Attachment upload failed:", error);
        if (typeof options?.onError === "function") {
          options.onError(error);
        }
        throw error;
      });
  }

  window.uploadLeadAttachments = uploadLeadAttachments;
})(jQuery);
