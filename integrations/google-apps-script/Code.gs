var APP_BHXH_CONFIG = {
  workbookId: '1GsUDJJbFzOJV35HsoSqhi1jVzfurvd6_I3ECkZczPNg',
  sheetNames: {
    icdCatalog: 'catalog_icd',
    protocolHeader: 'protocol_header',
    protocolItem: 'protocol_item',
    claimRisk: 'rule_claim_risk',
    costComposition: 'rule_cost_composition',
    clsCatalog: 'catalog_cls',
    medicationCatalog: 'catalog_medication',
    icdClsMapping: 'mapping_icd_cls',
    icdMedicationMapping: 'mapping_icd_medication'
  }
};

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'pilot-context';

  if (action === 'template') {
    return jsonOutput(getTemplatePayload());
  }

  if (action === 'workbook-inspect') {
    return jsonOutput(getWorkbookInspectPayload());
  }

  if (action === 'workbook-preview') {
    return jsonOutput(getWorkbookPreviewPayload(e));
  }

  if (action === 'change-log') {
    return jsonOutput(getChangeLogPayload(e));
  }

  if (action === 'pilot-context') {
    return jsonOutput(getPilotContextPayload());
  }

  return jsonOutput({
    error: 'Unsupported action',
    action: action
  });
}

function doPost(e) {
  var body = parseBody_(e);
  var action = body.action;

  if (action === 'recommendations-preview') {
    return jsonOutput(buildRecommendationPreview_(body));
  }

  if (action === 'update-record') {
    return jsonOutput(updateWorkbookRecord_(body));
  }

  if (action === 'create-icd-rule-bundle') {
    return jsonOutput(createIcdRuleBundle_(body));
  }

  if (action === 'create-catalog-entry') {
    return jsonOutput(createCatalogEntry_(body));
  }

  return jsonOutput({
    error: 'Unsupported action',
    action: action || null
  });
}

function getTemplatePayload() {
  return {
    workbookName: 'App BHXH Pilot Knowledge Base',
    tabs: [
      'catalog_icd',
      'catalog_cls',
      'catalog_medication',
      'protocol_header',
      'protocol_item',
      'rule_claim_risk',
      'rule_cost_composition',
      'mapping_icd_cls',
      'mapping_icd_medication',
      'import_control'
    ]
  };
}

function getWorkbookInspectPayload() {
  var template = getTemplatePayload();
  var workbook = getWorkbook_();
  var tabs = template.tabs.map(function (tabName) {
    var sheet = workbook.getSheetByName(tabName);

    if (!sheet) {
      return {
        name: tabName,
        exists: false,
        rowCount: 0,
        columnCount: 0,
        headers: [],
        missingColumns: getRequiredColumnsForTab_(tabName)
      };
    }

    var values = sheet.getDataRange().getValues();
    var headers = values.length > 0 ? values[0].map(function (item) { return String(item); }) : [];
    var requiredColumns = getRequiredColumnsForTab_(tabName);
    var missingColumns = requiredColumns.filter(function (column) {
      return headers.indexOf(column) < 0;
    });

    return {
      name: tabName,
      exists: true,
      rowCount: Math.max(values.length - 1, 0),
      columnCount: headers.length,
      headers: headers,
      missingColumns: missingColumns
    };
  });

  return {
    workbookName: workbook.getName(),
    workbookId: workbook.getId(),
    tabs: tabs,
    ready: tabs.every(function (tab) {
      return tab.exists && tab.missingColumns.length === 0;
    })
  };
}

function getWorkbookPreviewPayload(e) {
  var workbook = getWorkbook_();
  var template = getTemplatePayload();
  var requestedTabs = [];

  if (e && e.parameter && e.parameter.tabs) {
    requestedTabs = String(e.parameter.tabs)
      .split(',')
      .map(function (item) { return String(item).trim(); })
      .filter(function (item) { return item !== ''; });
  }

  var previewTabs = requestedTabs.length > 0
    ? requestedTabs
    : [
        'catalog_icd',
        'catalog_cls',
        'catalog_medication',
        'mapping_icd_cls',
        'rule_claim_risk'
      ];

  var tabs = previewTabs
    .filter(function (tabName) {
      return template.tabs.indexOf(tabName) >= 0;
    })
    .map(function (tabName) {
      var rows = readSheetObjects_(tabName).slice(0, 50);
      var headers = rows.length > 0
        ? Object.keys(rows[0])
        : getRequiredColumnsForTab_(tabName);

      return {
        name: tabName,
        headers: headers,
        rows: rows,
        rowCount: readSheetObjects_(tabName).length
      };
    });

  return {
    workbookName: workbook.getName(),
    workbookId: workbook.getId(),
    tabs: tabs
  };
}

function updateWorkbookRecord_(body) {
  var tabName = body.tabName;
  var keyField = body.keyField;
  var keyValue = body.keyValue;
  var updates = body.updates || {};
  var actor = body.actor || 'admin-ui';
  var note = body.note || '';
  var editableTabs = [
    'catalog_icd',
    'catalog_cls',
    'catalog_medication',
    'mapping_icd_cls',
    'rule_claim_risk'
  ];

  if (!tabName || editableTabs.indexOf(tabName) < 0) {
    return {
      ok: false,
      error: 'invalid_tab',
      message: 'Tab khong nam trong danh sach cho phep cap nhat.'
    };
  }

  if (!keyField || String(keyValue).trim() === '') {
    return {
      ok: false,
      error: 'missing_key',
      message: 'Thieu keyField hoac keyValue de xac dinh dong can sua.'
    };
  }

  var sheet = getWorkbook_().getSheetByName(tabName);

  if (!sheet) {
    return {
      ok: false,
      error: 'missing_sheet',
      message: 'Khong tim thay tab can cap nhat trong workbook.'
    };
  }

  var values = sheet.getDataRange().getValues();

  if (!values || values.length < 2) {
    return {
      ok: false,
      error: 'empty_sheet',
      message: 'Tab hien tai chua co du lieu de cap nhat.'
    };
  }

  var headers = values[0].map(function (item) { return String(item); });
  var keyIndex = headers.indexOf(keyField);

  if (keyIndex < 0) {
    return {
      ok: false,
      error: 'missing_key_field',
      message: 'Khong tim thay cot khoa trong tab da chon.'
    };
  }

  var rowIndex = -1;

  for (var i = 1; i < values.length; i += 1) {
    if (String(values[i][keyIndex]) === String(keyValue)) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex < 0) {
    return {
      ok: false,
      error: 'row_not_found',
      message: 'Khong tim thay dong phu hop voi ma khoa duoc chon.'
    };
  }

  var changedFields = [];
  headers.forEach(function (header, index) {
    if (!Object.prototype.hasOwnProperty.call(updates, header)) {
      return;
    }

    if (header === keyField) {
      return;
    }

    var newValue = updates[header];
    var normalizedValue = newValue === null || newValue === undefined ? '' : newValue;
    var oldValue = sheet.getRange(rowIndex, index + 1).getValue();

    if (String(oldValue) === String(normalizedValue)) {
      return;
    }

    sheet.getRange(rowIndex, index + 1).setValue(normalizedValue);
    changedFields.push({
      field: header,
      oldValue: oldValue,
      newValue: normalizedValue
    });
  });

  if (changedFields.length === 0) {
    return {
      ok: true,
      message: 'Khong co thay doi nao de luu.',
      updatedRow: readRowByKey_(sheet, headers, keyField, keyValue),
      changedFields: []
    };
  }

  appendAuditLog_({
    tabName: tabName,
    keyField: keyField,
    keyValue: keyValue,
    changedFields: changedFields,
    actor: actor,
    note: note
  });

  return {
    ok: true,
    message: 'Da cap nhat thanh cong du lieu tren Google Sheet.',
    updatedRow: readRowByKey_(sheet, headers, keyField, keyValue),
    changedFields: changedFields
  };
}

function createIcdRuleBundle_(body) {
  var icdCode = String(body.icdCode || '').trim();
  var icdName = String(body.icdName || '').trim();
  var chapter = String(body.chapter || 'Noi khoa').trim();
  var clsSelections = normalizeMappingSelections_(body.clsSelections, body.clsCodes, 'recommended');
  var drugSelections = normalizeMappingSelections_(body.drugSelections, body.drugCodes, 'preferred');
  var severity = String(body.severity || 'medium').trim();
  var warningMessage = String(body.warningMessage || '').trim();
  var recommendedAction = String(body.recommendedAction || '').trim();
  var actor = String(body.actor || 'admin-ui').trim();
  var note = String(body.note || '').trim();
  var sourceVersion = String(body.sourceVersion || 'CLINIC-DRAFT-0').trim();
  var protocolName = String(body.protocolName || ('Phac do ' + icdName)).trim();
  var protocolStatus = String(body.protocolStatus || 'active').trim();
  var protocolOwner = String(body.protocolOwner || 'Phong kham').trim();
  var icdRatioMax = Number(body.icdRatioMax || 30);
  var clsRatioMax = Number(body.clsRatioMax || 40);
  var drugRatioMax = Number(body.drugRatioMax || 30);
  var professionalProfile = {
    primaryRuleSet: String(body.primaryRuleSet || 'claim-basic').trim(),
    rulePriorityLevel: String(body.rulePriorityLevel || 'high').trim(),
    ruleFocus: String(body.ruleFocus || 'Canh bao truoc xuat toan').trim(),
    description: String(body.description || '').trim(),
    careSetting: String(body.careSetting || '').trim(),
    ageGroup: String(body.ageGroup || '').trim(),
    visitContext: String(body.visitContext || '').trim(),
    triggerSymptoms: String(body.triggerSymptoms || '').trim(),
    contraindications: String(body.contraindications || '').trim(),
    labPurposeNote: String(body.labPurposeNote || '').trim(),
    medicationRoleNote: String(body.medicationRoleNote || '').trim(),
    reimbursementNote: String(body.reimbursementNote || '').trim(),
    note: String(body.note || '').trim(),
    systemSupportNote: String(body.systemSupportNote || '').trim()
  };

  if (!icdCode || !icdName) {
    return {
      ok: false,
      error: 'missing_icd',
      message: 'Can nhap day du ma ICD va ten ICD.'
    };
  }

  upsertCatalogIcd_(icdCode, icdName, chapter, sourceVersion);
  var protocolCode = buildProtocolCode_(icdCode);
  upsertProtocolHeader_(protocolCode, protocolName, chapter, String(body.careSetting || 'Ngoai tru').trim(), sourceVersion, protocolStatus, protocolOwner);
  syncProtocolItems_(protocolCode, clsSelections, drugSelections, sourceVersion);
  syncMappingRows_('mapping_icd_cls', 'cls_code', icdCode, clsSelections, sourceVersion);
  syncMappingRows_('mapping_icd_medication', 'drug_code', icdCode, drugSelections, sourceVersion);
  upsertClaimRiskRule_(
    icdCode,
    icdName,
    severity,
    warningMessage,
    recommendedAction,
    JSON.stringify(professionalProfile),
    sourceVersion
  );
  upsertCostCompositionRule_(icdCode, icdName, icdRatioMax, clsRatioMax, drugRatioMax, warningMessage, sourceVersion);

  appendAuditLog_({
    tabName: 'quick_create_icd_bundle',
    keyField: 'icd_code',
    keyValue: icdCode,
    actor: actor,
    note: note || 'Tao nhanh ICD moi tu man admin',
    changedFields: [
      { field: 'icd_name', newValue: icdName },
      { field: 'cls_count', newValue: clsSelections.length },
      { field: 'drug_count', newValue: drugSelections.length },
      { field: 'severity', newValue: severity }
    ]
  });

  return {
    ok: true,
    message: 'Da tao nhanh cau hinh cho ICD moi.',
    summary: {
      icdCode: icdCode,
      icdName: icdName,
      clsCount: clsCodes.length,
      drugCount: drugCodes.length,
      severity: severity
    }
  };
}

function createCatalogEntry_(body) {
  var kind = String(body.kind || '').trim();
  var actor = String(body.actor || 'admin-ui').trim();
  var note = String(body.note || '').trim();
  var sourceRef = String(body.sourceRef || 'CLINIC-DRAFT-0').trim();

  if (kind === 'cls') {
    var clsCode = String(body.code || '').trim();
    var clsName = String(body.name || '').trim();
    var clsGroup = String(body.group || 'CLS bo sung').trim();
    var unit = String(body.unit || '').trim();
    var defaultFrequency = String(body.defaultFrequency || '').trim();

    if (!clsName) {
      return {
        ok: false,
        error: 'missing_cls',
        message: 'Can nhap ten xet nghiem/tham do.'
      };
    }

    if (!clsCode) {
      clsCode = generateCatalogCode_(APP_BHXH_CONFIG.sheetNames.clsCatalog, 'cls_code', 'CLS', clsName);
    }

    upsertCatalogEntry_(
      APP_BHXH_CONFIG.sheetNames.clsCatalog,
      'cls_code',
      clsCode,
      {
        cls_code: clsCode,
        cls_name: clsName,
        cls_group: clsGroup,
        unit: unit,
        default_frequency: defaultFrequency,
        is_active: true,
        source_ref: sourceRef
      }
    );

    appendAuditLog_({
      tabName: APP_BHXH_CONFIG.sheetNames.clsCatalog,
      keyField: 'cls_code',
      keyValue: clsCode,
      actor: actor,
      note: note || 'Them nhanh xet nghiem/tham do tu man admin',
      changedFields: [
        { field: 'cls_name', newValue: clsName },
        { field: 'cls_group', newValue: clsGroup }
      ]
    });

    return {
      ok: true,
      kind: 'cls',
      code: clsCode,
      name: clsName,
      message: 'Da them xet nghiem/tham do moi vao danh muc.'
    };
  }

  if (kind === 'medication') {
    var drugCode = String(body.code || '').trim();
    var drugName = String(body.name || '').trim();
    var drugGroup = String(body.group || 'Thuoc bo sung').trim();
    var route = String(body.route || '').trim();
    var strength = String(body.strength || '').trim();
    var isBhytCovered = String(body.isBhytCovered || 'true').trim().toLowerCase() !== 'false';

    if (!drugName) {
      return {
        ok: false,
        error: 'missing_medication',
        message: 'Can nhap ten thuoc/nhom thuoc.'
      };
    }

    if (!drugCode) {
      drugCode = generateCatalogCode_(APP_BHXH_CONFIG.sheetNames.medicationCatalog, 'drug_code', 'DRUG', drugName);
    }

    upsertCatalogEntry_(
      APP_BHXH_CONFIG.sheetNames.medicationCatalog,
      'drug_code',
      drugCode,
      {
        drug_code: drugCode,
        drug_name: drugName,
        drug_group: drugGroup,
        route: route,
        strength: strength,
        is_bhyt_covered: isBhytCovered,
        is_active: true,
        source_ref: sourceRef
      }
    );

    appendAuditLog_({
      tabName: APP_BHXH_CONFIG.sheetNames.medicationCatalog,
      keyField: 'drug_code',
      keyValue: drugCode,
      actor: actor,
      note: note || 'Them nhanh thuoc/nhom thuoc tu man admin',
      changedFields: [
        { field: 'drug_name', newValue: drugName },
        { field: 'drug_group', newValue: drugGroup }
      ]
    });

    return {
      ok: true,
      kind: 'medication',
      code: drugCode,
      name: drugName,
      message: 'Da them thuoc/nhom thuoc moi vao danh muc.'
    };
  }

  return {
    ok: false,
    error: 'invalid_kind',
    message: 'Loai danh muc khong hop le.'
  };
}

function getPilotContextPayload() {
  return {
    careSetting: 'outpatient',
    specialty: 'internal-medicine',
    behavior: 'recommendation-only',
    protocolSource: 'Ministry of Health seed guidance',
    storageMode: 'google-sheets-pilot'
  };
}

function getChangeLogPayload(e) {
  var limit = 20;

  if (e && e.parameter && e.parameter.limit) {
    limit = Math.max(1, Math.min(100, Number(e.parameter.limit) || 20));
  }

  var rows = readSheetObjects_('admin_change_log');
  var recentRows = rows.slice(Math.max(rows.length - limit, 0)).reverse();

  return {
    total: rows.length,
    rows: recentRows
  };
}

function buildRecommendationPreview_(body) {
  var diagnoses = body.diagnoses || [];
  var diagnosisCodes = diagnoses.map(function (item) {
    return item.icd;
  });

  var protocolItems = readSheetObjects_(APP_BHXH_CONFIG.sheetNames.protocolItem);
  var claimRiskRules = readSheetObjects_(APP_BHXH_CONFIG.sheetNames.claimRisk);
  var costRules = readSheetObjects_(APP_BHXH_CONFIG.sheetNames.costComposition);
  var clsCatalog = readSheetObjects_(APP_BHXH_CONFIG.sheetNames.clsCatalog);
  var medicationCatalog = readSheetObjects_(APP_BHXH_CONFIG.sheetNames.medicationCatalog);
  var icdClsMappings = readSheetObjects_(APP_BHXH_CONFIG.sheetNames.icdClsMapping);
  var icdMedicationMappings = readSheetObjects_(APP_BHXH_CONFIG.sheetNames.icdMedicationMapping);
  var primaryRule = claimRiskRules.filter(function (rule) {
    return diagnosisCodes.indexOf(rule.applies_to_icd) >= 0;
  })[0] || {};
  var professionalProfile = parseJsonSafe_(primaryRule.condition_expression);

  var investigationItems = buildMappedItems_({
    diagnosisCodes: diagnosisCodes,
    mappings: icdClsMappings,
    catalog: clsCatalog,
    protocolItems: protocolItems.filter(function (item) {
      return item.item_type === 'cls';
    }),
    catalogCodeField: 'cls_code',
    mappingCodeField: 'cls_code',
    preferredType: 'recommended',
    detailBuilder: function (catalogItem, mapping) {
      return {
        detail: catalogItem.default_frequency || '',
        mappingNote: mapping.note || ''
      };
    }
  });

  var medicationItems = buildMappedItems_({
    diagnosisCodes: diagnosisCodes,
    mappings: icdMedicationMappings,
    catalog: medicationCatalog,
    protocolItems: protocolItems.filter(function (item) {
      return item.item_type === 'medication';
    }),
    catalogCodeField: 'drug_code',
    mappingCodeField: 'drug_code',
    preferredType: 'preferred',
    detailBuilder: function (catalogItem, mapping) {
      var detailParts = [];

      if (catalogItem.route) {
        detailParts.push(catalogItem.route);
      }

      if (catalogItem.strength) {
        detailParts.push(catalogItem.strength);
      }

      return {
        detail: detailParts.join(' / '),
        mappingNote: mapping.note || ''
      };
    }
  });

  var alerts = claimRiskRules
    .filter(function (rule) {
      if (!rule.applies_to_icd) {
        return true;
      }

      return diagnosisCodes.indexOf(rule.applies_to_icd) >= 0;
    })
    .slice(0, 3)
    .map(function (rule) {
      return {
        severity: rule.severity || 'medium',
        title: rule.rule_name || 'Claim risk',
        description: rule.warning_message || 'Review this rule before confirming the draft.'
      };
    });

  var costComposition = {
    ICD: 28,
    CLS: 41,
    Thuoc: 31
  };

  if (costRules.length > 0) {
    var first = costRules[0];
    costComposition = {
      ICD: Number(first.icd_ratio_max || 28),
      CLS: Number(first.cls_ratio_max || 41),
      Thuoc: Number(first.drug_ratio_max || 31)
    };
  }

  return {
    source: 'google-apps-script',
    encounter: {
      code: body.encounterCode || 'OP-IM-0001',
      careSetting: 'outpatient',
      specialty: 'internal-medicine'
    },
    diagnoses: diagnoses,
    recommendations: {
      investigations: investigationItems,
      investigationsNote: professionalProfile.labPurposeNote || '',
      medicationGroups: medicationItems,
      medicationGroupsNote: professionalProfile.medicationRoleNote || ''
    },
    reimbursementGuard: {
      costComposition: {
        icd: costComposition.ICD,
        cls: costComposition.CLS,
        medications: costComposition.Thuoc
      },
      alerts: alerts
    }
  };
}

function buildMappedItems_(config) {
  var diagnosisCodes = config.diagnosisCodes || [];
  var mappings = config.mappings || [];
  var catalog = config.catalog || [];
  var protocolItems = config.protocolItems || [];
  var catalogCodeField = config.catalogCodeField;
  var mappingCodeField = config.mappingCodeField;
  var preferredType = config.preferredType;
  var detailBuilder = config.detailBuilder;

  var catalogByCode = {};
  catalog.forEach(function (item) {
    catalogByCode[item[catalogCodeField]] = item;
  });

  var protocolByCode = {};
  protocolItems.forEach(function (item) {
    protocolByCode[item.item_code] = item;
  });

  var matchedMappings = mappings
    .filter(function (mapping) {
      return diagnosisCodes.indexOf(mapping.icd_code) >= 0;
    })
    .sort(function (left, right) {
      var leftPriority = Number(left.priority || 999);
      var rightPriority = Number(right.priority || 999);

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      if (left.mapping_type === preferredType && right.mapping_type !== preferredType) {
        return -1;
      }

      if (left.mapping_type !== preferredType && right.mapping_type === preferredType) {
        return 1;
      }

      return 0;
    });

  var seen = {};
  var results = [];

  matchedMappings.forEach(function (mapping) {
    var code = mapping[mappingCodeField];

    if (!code || seen[code]) {
      return;
    }

    seen[code] = true;

    var catalogItem = catalogByCode[code] || {};
    var protocolItem = protocolByCode[code] || {};
    var name = catalogItem.cls_name || catalogItem.drug_name || protocolItem.item_name || code;
    var rationale = protocolItem.rationale || mapping.note || '';
    var detailPayload = detailBuilder ? detailBuilder(catalogItem, mapping) : {};
    var sourceParts = [];

    if (mapping.source_version) {
      sourceParts.push(mapping.source_version);
    }

    if (protocolItem.protocol_code) {
      sourceParts.push(protocolItem.protocol_code);
    }

    results.push({
      name: name,
      rationale: rationale,
      source: sourceParts.length > 0 ? sourceParts.join(' | ') : 'Google Sheet mapping',
      detail: detailPayload.detail || '',
      mappingNote: detailPayload.mappingNote || ''
    });
  });

  if (results.length > 0) {
    return results;
  }

  return protocolItems.map(function (item) {
    return {
      name: item.item_name,
      rationale: item.rationale || '',
      source: item.protocol_code || 'Protocol fallback',
      detail: '',
      mappingNote: ''
    };
  });
}

function parseJsonSafe_(value) {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(String(value));
  } catch (error) {
    return {};
  }
}

function readSheetObjects_(sheetName) {
  var sheet = getWorkbook_().getSheetByName(sheetName);

  if (!sheet) {
    return [];
  }

  var values = sheet.getDataRange().getValues();

  if (!values || values.length < 2) {
    return [];
  }

  var headers = values[0];
  return values.slice(1).filter(function (row) {
    return row.some(function (cell) {
      return String(cell).trim() !== '';
    });
  }).map(function (row) {
    var obj = {};

    headers.forEach(function (header, index) {
      obj[header] = row[index];
    });

    return obj;
  });
}

function upsertCatalogIcd_(icdCode, icdName, chapter, sourceVersion) {
  var sheet = getWorkbook_().getSheetByName(APP_BHXH_CONFIG.sheetNames.icdCatalog);
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function (item) { return String(item); });
  var keyIndex = headers.indexOf('icd_code');
  var rowIndex = -1;

  for (var i = 1; i < values.length; i += 1) {
    if (String(values[i][keyIndex]) === icdCode) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex > 0) {
    setCellValueByHeader_(sheet, headers, rowIndex, 'icd_name', icdName);
    setCellValueByHeader_(sheet, headers, rowIndex, 'chapter', chapter);
    return;
  }

  appendObjectRow_(sheet, headers, {
    icd_code: icdCode,
    icd_name: icdName,
    chapter: chapter,
    is_active: true,
    effective_from: new Date(),
    effective_to: '',
    source_ref: sourceVersion
  });
}

function upsertCatalogEntry_(sheetName, keyField, keyValue, rowObject) {
  var sheet = getWorkbook_().getSheetByName(sheetName);
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function (item) { return String(item); });
  var keyIndex = headers.indexOf(keyField);
  var rowIndex = -1;

  for (var i = 1; i < values.length; i += 1) {
    if (String(values[i][keyIndex]) === keyValue) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex > 0) {
    headers.forEach(function (header) {
      if (Object.prototype.hasOwnProperty.call(rowObject, header)) {
        setCellValueByHeader_(sheet, headers, rowIndex, header, rowObject[header]);
      }
    });
    return;
  }

  appendObjectRow_(sheet, headers, rowObject);
}

function generateCatalogCode_(sheetName, keyField, prefix, name) {
  var rows = readSheetObjects_(sheetName);
  var normalizedName = String(name || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 24);
  var baseCode = prefix + '-' + (normalizedName || 'ITEM');
  var candidate = baseCode;
  var counter = 2;

  while (
    rows.some(function (row) {
      return String(row[keyField] || '') === candidate;
    })
  ) {
    candidate = baseCode + '-' + counter;
    counter += 1;
  }

  return candidate;
}

function appendMappingRows_(sheetName, codeField, icdCode, codes, sourceVersion, note) {
  if (!codes || codes.length === 0) {
    return;
  }

  var sheet = getWorkbook_().getSheetByName(sheetName);
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function (item) { return String(item); });
  var existingRows = readSheetObjects_(sheetName);

  codes.forEach(function (code, index) {
    var exists = existingRows.some(function (row) {
      return String(row.icd_code) === icdCode && String(row[codeField]) === code;
    });

    if (exists) {
      return;
    }

    var row = {
      icd_code: icdCode,
      mapping_type: 'recommended',
      priority: index + 1,
      source_version: sourceVersion,
      note: note || 'Tao nhanh tu man admin'
    };
    row[codeField] = code;
    appendObjectRow_(sheet, headers, row);
  });
}

function syncMappingRows_(sheetName, codeField, icdCode, entries, sourceVersion) {
  var normalizedEntries = [];
  var seen = {};

  (entries || []).forEach(function (entry) {
    var code = String(entry && entry.code || '').trim();

    if (!code || seen[code]) {
      return;
    }

    seen[code] = true;
    normalizedEntries.push({
      code: code,
      note: String(entry && entry.note || '').trim(),
      mappingType: String(entry && entry.mappingType || 'recommended').trim() || 'recommended'
    });
  });

  var sheet = getWorkbook_().getSheetByName(sheetName);
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function (item) { return String(item); });
  var icdIndex = headers.indexOf('icd_code');

  for (var rowIndex = values.length; rowIndex >= 2; rowIndex -= 1) {
    if (String(values[rowIndex - 1][icdIndex]) === icdCode) {
      sheet.deleteRow(rowIndex);
    }
  }

  normalizedEntries.forEach(function (entry, index) {
    var row = {
      icd_code: icdCode,
      mapping_type: entry.mappingType,
      priority: index + 1,
      source_version: sourceVersion,
      note: entry.note
    };
    row[codeField] = entry.code;
    appendObjectRow_(sheet, headers, row);
  });
}

function buildProtocolCode_(icdCode) {
  return 'PTCL-' + String(icdCode || '').replace(/\./g, '').toUpperCase();
}

function upsertProtocolHeader_(protocolCode, protocolName, specialtyCode, careSetting, sourceVersion, status, ownerName) {
  var sheet = getWorkbook_().getSheetByName(APP_BHXH_CONFIG.sheetNames.protocolHeader);
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function (item) { return String(item); });
  var existing = readRowByKey_(sheet, headers, 'protocol_code', protocolCode);
  var rowObject = {
    protocol_code: protocolCode,
    protocol_name: protocolName,
    specialty_code: specialtyCode || 'Noi khoa',
    care_setting: careSetting || 'Ngoai tru',
    source_type: 'clinic-admin',
    source_version: sourceVersion,
    effective_from: formatDateIso_(new Date()),
    effective_to: '',
    status: status || 'active',
    owner_name: ownerName || 'Phong kham'
  };

  if (existing) {
    var rowIndex = findRowIndexByKey_(sheet, headers, 'protocol_code', protocolCode);
    headers.forEach(function (header) {
      if (Object.prototype.hasOwnProperty.call(rowObject, header)) {
        setCellValueByHeader_(sheet, headers, rowIndex, header, rowObject[header]);
      }
    });
    return;
  }

  appendObjectRow_(sheet, headers, rowObject);
}

function syncProtocolItems_(protocolCode, clsSelections, drugSelections, sourceVersion) {
  var sheet = getWorkbook_().getSheetByName(APP_BHXH_CONFIG.sheetNames.protocolItem);
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function (item) { return String(item); });
  var protocolIndex = headers.indexOf('protocol_code');

  for (var rowIndex = values.length; rowIndex >= 2; rowIndex -= 1) {
    if (String(values[rowIndex - 1][protocolIndex]) === protocolCode) {
      sheet.deleteRow(rowIndex);
    }
  }

  var clsCatalog = readSheetObjects_(APP_BHXH_CONFIG.sheetNames.clsCatalog);
  var drugCatalog = readSheetObjects_(APP_BHXH_CONFIG.sheetNames.medicationCatalog);
  var clsByCode = {};
  var drugByCode = {};

  clsCatalog.forEach(function (item) {
    clsByCode[String(item.cls_code || '')] = item;
  });

  drugCatalog.forEach(function (item) {
    drugByCode[String(item.drug_code || '')] = item;
  });

  var sortOrder = 1;

  (clsSelections || []).forEach(function (entry) {
    var catalogItem = clsByCode[String(entry.code || '')] || {};
    appendObjectRow_(sheet, headers, {
      protocol_code: protocolCode,
      item_type: 'cls',
      item_code: entry.code,
      item_name: catalogItem.cls_name || entry.code,
      recommendation_level: entry.mappingType || 'recommended',
      condition_note: entry.note || '',
      rationale: entry.note || '',
      sort_order: sortOrder,
      is_required: false
    });
    sortOrder += 1;
  });

  (drugSelections || []).forEach(function (entry) {
    var catalogItem = drugByCode[String(entry.code || '')] || {};
    appendObjectRow_(sheet, headers, {
      protocol_code: protocolCode,
      item_type: 'medication',
      item_code: entry.code,
      item_name: catalogItem.drug_name || entry.code,
      recommendation_level: entry.mappingType || 'preferred',
      condition_note: entry.note || '',
      rationale: entry.note || '',
      sort_order: sortOrder,
      is_required: false
    });
    sortOrder += 1;
  });
}

function upsertCostCompositionRule_(icdCode, icdName, icdRatioMax, clsRatioMax, drugRatioMax, warningMessage, sourceVersion) {
  var sheet = getWorkbook_().getSheetByName(APP_BHXH_CONFIG.sheetNames.costComposition);
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function (item) { return String(item); });
  var existingIndex = findScopedCostRuleRowIndex_(sheet, headers, 'icd', icdCode);
  var rowObject = {
    rule_code: existingIndex > 0 ? String(values[existingIndex - 1][headers.indexOf('rule_code')]) : ('COST-' + String(icdCode || '').replace(/\./g, '').toUpperCase()),
    scope_type: 'icd',
    scope_code: icdCode,
    icd_ratio_min: 0,
    icd_ratio_max: Number(isNaN(icdRatioMax) ? 30 : icdRatioMax),
    cls_ratio_min: 0,
    cls_ratio_max: Number(isNaN(clsRatioMax) ? 40 : clsRatioMax),
    drug_ratio_min: 0,
    drug_ratio_max: Number(isNaN(drugRatioMax) ? 30 : drugRatioMax),
    warning_message: warningMessage || ('Ra soat co cau chi phi cho ' + icdName),
    is_active: true
  };

  if (existingIndex > 0) {
    headers.forEach(function (header) {
      if (Object.prototype.hasOwnProperty.call(rowObject, header)) {
        setCellValueByHeader_(sheet, headers, existingIndex, header, rowObject[header]);
      }
    });
    return;
  }

  appendObjectRow_(sheet, headers, rowObject);
}

function upsertClaimRiskRule_(icdCode, icdName, severity, warningMessage, recommendedAction, conditionExpression, sourceVersion) {
  var sheet = getWorkbook_().getSheetByName(APP_BHXH_CONFIG.sheetNames.claimRisk);
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function (item) { return String(item); });
  var icdIndex = headers.indexOf('applies_to_icd');
  var rowIndex = -1;

  for (var i = 1; i < values.length; i += 1) {
    if (String(values[i][icdIndex]) === icdCode) {
      rowIndex = i + 1;
      break;
    }
  }

  var rowObject = {
    rule_code: rowIndex > 0 ? String(values[rowIndex - 1][headers.indexOf('rule_code')]) : generateRuleCode_(icdCode),
    rule_name: 'Canh bao cho ' + icdName,
    severity: severity,
    applies_to_icd: icdCode,
    applies_to_cls: '',
    applies_to_drug: '',
    condition_expression: conditionExpression || '',
    warning_message: warningMessage || ('Ra soat chi dinh lien quan den ' + icdName),
    recommended_action: recommendedAction || 'Xem lai CLS va thuoc truoc khi chot',
    source_version: sourceVersion,
    is_active: true
  };

  if (rowIndex > 0) {
    headers.forEach(function (header) {
      if (Object.prototype.hasOwnProperty.call(rowObject, header)) {
        setCellValueByHeader_(sheet, headers, rowIndex, header, rowObject[header]);
      }
    });
    return;
  }

  appendObjectRow_(sheet, headers, rowObject);
}

function appendObjectRow_(sheet, headers, rowObject) {
  var row = headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(rowObject, header) ? rowObject[header] : '';
  });
  sheet.appendRow(row);
}

function setCellValueByHeader_(sheet, headers, rowIndex, headerName, value) {
  var columnIndex = headers.indexOf(headerName);
  if (columnIndex < 0) {
    return;
  }
  sheet.getRange(rowIndex, columnIndex + 1).setValue(value);
}

function normalizeCodesList_(input) {
  if (!input) {
    return [];
  }

  if (Object.prototype.toString.call(input) === '[object Array]') {
    return input
      .map(function (item) { return String(item).trim(); })
      .filter(function (item) { return item !== ''; });
  }

  return String(input)
    .split(',')
    .map(function (item) { return String(item).trim(); })
    .filter(function (item) { return item !== ''; });
}

function normalizeMappingSelections_(selections, fallbackCodes, preferredType) {
  if (Object.prototype.toString.call(selections) === '[object Array]') {
    return selections
      .map(function (item) {
        var code = String(item && item.code || '').trim();

        if (!code) {
          return null;
        }

        return {
          code: code,
          note: String(item && item.note || '').trim(),
          mappingType: String(item && item.mappingType || preferredType || 'recommended').trim() || 'recommended'
        };
      })
      .filter(function (item) {
        return item !== null;
      });
  }

  return normalizeCodesList_(fallbackCodes).map(function (code) {
    return {
      code: code,
      note: '',
      mappingType: preferredType || 'recommended'
    };
  });
}

function generateRuleCode_(icdCode) {
  return 'RULE-' + icdCode.replace(/\./g, '') + '-' + new Date().getTime();
}

function formatDateIso_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function findRowIndexByKey_(sheet, headers, keyField, keyValue) {
  var values = sheet.getDataRange().getValues();
  var keyIndex = headers.indexOf(keyField);

  if (keyIndex < 0) {
    return -1;
  }

  for (var i = 1; i < values.length; i += 1) {
    if (String(values[i][keyIndex]) === String(keyValue)) {
      return i + 1;
    }
  }

  return -1;
}

function findScopedCostRuleRowIndex_(sheet, headers, scopeType, scopeCode) {
  var values = sheet.getDataRange().getValues();
  var scopeTypeIndex = headers.indexOf('scope_type');
  var scopeCodeIndex = headers.indexOf('scope_code');

  if (scopeTypeIndex < 0 || scopeCodeIndex < 0) {
    return -1;
  }

  for (var i = 1; i < values.length; i += 1) {
    if (
      String(values[i][scopeTypeIndex]).toLowerCase() === String(scopeType).toLowerCase() &&
      String(values[i][scopeCodeIndex]) === String(scopeCode)
    ) {
      return i + 1;
    }
  }

  return -1;
}

function readRowByKey_(sheet, headers, keyField, keyValue) {
  var values = sheet.getDataRange().getValues();
  var keyIndex = headers.indexOf(keyField);

  if (keyIndex < 0) {
    return null;
  }

  for (var i = 1; i < values.length; i += 1) {
    if (String(values[i][keyIndex]) === String(keyValue)) {
      var row = {};

      headers.forEach(function (header, index) {
        row[header] = values[i][index];
      });

      return row;
    }
  }

  return null;
}

function appendAuditLog_(entry) {
  var workbook = getWorkbook_();
  var sheetName = 'admin_change_log';
  var sheet = workbook.getSheetByName(sheetName);

  if (!sheet) {
    sheet = workbook.insertSheet(sheetName);
    sheet.appendRow([
      'changed_at',
      'tab_name',
      'key_field',
      'key_value',
      'actor',
      'note',
      'changed_fields_json'
    ]);
  }

  sheet.appendRow([
    new Date(),
    entry.tabName,
    entry.keyField,
    entry.keyValue,
    entry.actor || 'admin-ui',
    entry.note || '',
    JSON.stringify(entry.changedFields || [])
  ]);
}

function getWorkbook_() {
  if (!APP_BHXH_CONFIG.workbookId) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }

  return SpreadsheetApp.openById(APP_BHXH_CONFIG.workbookId);
}

function getRequiredColumnsForTab_(tabName) {
  var template = {
    catalog_icd: ['icd_code', 'icd_name', 'chapter', 'is_active', 'effective_from', 'effective_to', 'source_ref'],
    catalog_cls: ['cls_code', 'cls_name', 'cls_group', 'unit', 'default_frequency', 'is_active', 'source_ref'],
    catalog_medication: ['drug_code', 'drug_name', 'drug_group', 'route', 'strength', 'is_bhyt_covered', 'is_active', 'source_ref'],
    protocol_header: ['protocol_code', 'protocol_name', 'specialty_code', 'care_setting', 'source_type', 'source_version', 'effective_from', 'effective_to', 'status', 'owner_name'],
    protocol_item: ['protocol_code', 'item_type', 'item_code', 'item_name', 'recommendation_level', 'condition_note', 'rationale', 'sort_order', 'is_required'],
    rule_claim_risk: ['rule_code', 'rule_name', 'severity', 'applies_to_icd', 'applies_to_cls', 'applies_to_drug', 'condition_expression', 'warning_message', 'recommended_action', 'source_version', 'is_active'],
    rule_cost_composition: ['rule_code', 'scope_type', 'scope_code', 'icd_ratio_min', 'icd_ratio_max', 'cls_ratio_min', 'cls_ratio_max', 'drug_ratio_min', 'drug_ratio_max', 'warning_message', 'is_active'],
    mapping_icd_cls: ['icd_code', 'cls_code', 'mapping_type', 'priority', 'source_version', 'note'],
    mapping_icd_medication: ['icd_code', 'drug_code', 'mapping_type', 'priority', 'source_version', 'note'],
    import_control: ['dataset_name', 'dataset_version', 'approved_by', 'approved_at', 'import_enabled', 'note']
  };

  return template[tabName] || [];
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }

  return JSON.parse(e.postData.contents);
}

function jsonOutput(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
