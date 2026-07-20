(function (global) {
  global.SIMPRO_CONFIG_PROD = global.SIMPRO_CONFIG_PROD || {
    baseUrl: "https://excel.simprocloud.com/api/v1.0",
    authToken: "c9c47eab18f514ad102ae8c78ce2a444e3bc4dab",
  };
  global.SIMPRO_CONFIG_UAT = global.SIMPRO_CONFIG_UAT || {
    baseUrl: "https://excel-uat.simprocloud.com/api/v1.0",
    authToken: "4eaf76846bcaf8104343397586480856b8a34f7c",
  };

  var env = 'PROD';
  try {
    env = String(global.localStorage.getItem('SIMPRO_ENV') || 'PROD').toUpperCase();
  } catch (e) {
    // localStorage may be unavailable in some environments; default to PROD.
  }

  global.SIMPRO_CONFIG = env === 'UAT' ? global.SIMPRO_CONFIG_UAT : global.SIMPRO_CONFIG_PROD;
})(window);
