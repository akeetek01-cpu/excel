$(function(){
  // Data model
  const jobData = {
    customer:{},
    asset:{description:'',location:''},
    faults:[],
    estimates:{technicians:0,hours:0,apprentice:false,afterHours:false},
    photos:[]
  };

  let currentStep = 0;
  const MAX_PHOTOS = 10;

  // Stepper render
  function renderStepper(){
    $('.step').each(function(i){
      $(this).removeClass('active completed');
      if(i<currentStep) $(this).addClass('completed');
      if(i===currentStep) $(this).addClass('active');
    });
  }

  function showStep(idx){
    currentStep = idx;
    renderStepper();
    $('.step-pane').addClass('d-none');
    $(`.step-pane[data-step-pane='${idx}']`).removeClass('d-none');
    // buttons
    if(idx===0){$('#backBtn').prop('disabled',true);} else {$('#backBtn').prop('disabled',false);} 
    if(idx === 2){
      $('#nextBtn').html('Submit');
    } else {
      $('#nextBtn').html('<i class="fa-solid fa-arrow-right"></i>');
    }
    $('#createNewBtn').toggle(idx === 2);
  }

  function resetWizard(){
    $('#form-customer')[0].reset();
    $('#faultList').empty();
    $('#assetDescriptionSelect').val('');
    $('#assetLocation').val('');
    $('#assetDescriptionInput')
      .val('')
      .addClass('d-none')
      .removeClass('is-invalid');
    $('#assetLocationInput')
      .val('')
      .addClass('d-none')
      .removeClass('is-invalid');
    $('#assetDescriptionError, #assetDescriptionInputError, #assetLocationError, #assetLocationInputError').text('');
    $('#technicians').val(1);
    $('#hours').val(0);
    $('#apprentice').val(0);
    $('#afterHours').prop('checked', false);
    jobData.customer = {};
    jobData.asset = {description:'',location:''};
    jobData.faults = [];
    jobData.estimates = {technicians:0,hours:0,apprentice:false,afterHours:false};
    jobData.photos = [];
    photoFiles = [];
    $('#previewGrid').empty();
    $('#uploadStatus').hide().text('');
    $('#jsonOutput').text('');
    $('#modalJobNum, #modalCustomer, #modalTime').text('');
    $('#revJob, #revCustomer, #revAsset, #revFaults, #revTech, #revHours, #revMan').text('-');
    $('.is-invalid').removeClass('is-invalid');
    $('.invalid-feedback').text('');
    addFault();
    showStep(0);
    calculate();
  }

  function showError(field, errorId, message){
    const $field = $(field);
    const $error = $(errorId);
    $field.addClass('is-invalid');
    $error.text(message);
  }

  function clearError(field, errorId){
    const $field = $(field);
    const $error = $(errorId);
    $field.removeClass('is-invalid');
    if($error.length) $error.text('');
  }

  function validateStep0(){
    let valid = true;

        let jobNumber = $('#jobNumber').val().trim();
    if(!$('#autoJob').is(':checked') && $('#jobNumber').val().trim() === ''){
      showError('#jobNumber', '#jobNumberError', 'Job Number is required.');
      valid = false;
    }  else if(!/^\d{6}$/.test(jobNumber)){
            showError('#jobNumber', '#jobNumberError', 'Job Number must be exactly 6 digits.');

      valid = false;
    } else {
      clearError('#jobNumber', '#jobNumberError');
    }
    let customerName = $('#customerName').val().trim();

    if(customerName === ''){
      showError('#customerName', '#customerNameError', 'Customer Name is required.');
      valid = false;
    } else if(customerName.length < 2){
      showError('#customerName', '#customerNameError', 'Customer Name must contain a minimum of 2 characters.');
      valid = false;
    } else {
      clearError('#customerName', '#customerNameError');
    }

    const phone = $('#customerPhone').val().trim();
    if(phone === ''){
      showError('#customerPhone', '#customerPhoneError', 'Phone Number is required.');
      valid = false;
    } else if(!/^\d+$/.test(phone)){
      showError('#customerPhone', '#customerPhoneError', 'Customer Phone must contain only numeric characters.');
      valid = false;
    } else if(phone.length < 9){
      showError('#customerPhone', '#customerPhoneError', 'Customer Phone must contain a minimum of 9 digits.');
      valid = false;
    } else if(phone.length > 12){
      showError('#customerPhone', '#customerPhoneError', 'Customer Phone cannot exceed 12 digits.');
      valid = false;
    } else {
      clearError('#customerPhone', '#customerPhoneError');
    }

    const email = $('#customerEmail').val().trim();
    if(email === ''){
      showError('#customerEmail', '#customerEmailError', 'Email is required.');
      valid = false;
    } else if(!/^\S+@\S+\.\S+$/.test(email)){
      showError('#customerEmail', '#customerEmailError', 'Enter a valid email address.');
      valid = false;
    } else {
      clearError('#customerEmail', '#customerEmailError');
    }

    if($('#customerTenancy').val().trim() === ''){
      showError('#customerTenancy', '#customerTenancyError', 'Tenancy / Shop is required.');
      valid = false;
    } else {
      clearError('#customerTenancy', '#customerTenancyError');
    }

    return valid;
  }

  function validateStep1(){
    let valid = true;

    if($('#assetDescriptionSelect').val() === ''){
      showError('#assetDescriptionSelect', '#assetDescriptionError', 'Asset Description is required.');
      valid = false;
    } else {
      clearError('#assetDescriptionSelect', '#assetDescriptionError');
    }

    if($('#assetDescriptionSelect').val() === 'other' && $('#assetDescriptionInput').val().trim() === ''){
      showError('#assetDescriptionInput', '#assetDescriptionInputError', 'Please enter Asset Description.');
      valid = false;
    } else {
      clearError('#assetDescriptionInput', '#assetDescriptionInputError');
    }

    if($('#assetLocation').val() === ''){
      showError('#assetLocation', '#assetLocationError', 'Asset Location is required.');
      valid = false;
    } else {
      clearError('#assetLocation', '#assetLocationError');
    }

    if($('#assetLocation').val() === 'other' && $('#assetLocationInput').val().trim() === ''){
      showError('#assetLocationInput', '#assetLocationInputError', 'Please enter Asset Location.');
      valid = false;
    } else {
      clearError('#assetLocationInput', '#assetLocationInputError');
    }

    const $faultCards = $('#faultList .fault-card');
    if($faultCards.length === 0){
      valid = false;
    } else {
      $faultCards.each(function(){
        const $card = $(this);

        const $desc = $card.find('.fault-desc');
        const $descError = $card.find('.fault-desc-error');
        const desc = $desc.val().trim();

        if(desc === ''){
          showError($desc, $descError, 'Fault Description is required.');
          valid = false;
        } else {
          clearError($desc, $descError);
        }

        const $work = $card.find('.work-req');
        const $workError = $card.find('.work-req-error');
        const work = $work.val().trim();

        if(work === ''){
          showError($work, $workError, 'Work required is required.');
          valid = false;
        } else if(work.length > 150){
          showError($work, $workError, 'Work required cannot exceed 150 characters.');
          valid = false;
        } else {
          clearError($work, $workError);
        }

        const $parts = $card.find('.parts');
        const $partsError = $card.find('.parts-error');
        const parts = $parts.val().trim();

        if(parts === ''){
          showError($parts, $partsError, 'Parts & material is required.');
          valid = false;
        } else if(parts.length > 150){
          showError($parts, $partsError, 'Parts & material cannot exceed 150 characters.');
          valid = false;
        } else {
          clearError($parts, $partsError);
        }

        const $equipment = $card.find('.equipment');
        const $equipmentError = $card.find('.equipment-error');
        const equipment = $equipment.val().trim();

        if(equipment === ''){
          showError($equipment, $equipmentError, 'Special equipment is required.');
          valid = false;
        } else if(equipment.length > 150){
          showError($equipment, $equipmentError, 'Special equipment cannot exceed 150 characters.');
          valid = false;
        } else {
          clearError($equipment, $equipmentError);
        }
      });
    }

    return valid;
  }

  $('#jobNumber').on('blur', function(){
    const value = $(this).val().trim();
    if(!$('#autoJob').is(':checked') && value === ''){
      showError('#jobNumber', '#jobNumberError', 'Job Number is required.');
    } else if(!$('#autoJob').is(':checked') && !/^\d{6}$/.test(value)){
      showError('#jobNumber', '#jobNumberError', 'Job Number must be exactly 6 digits.');
    } else {
      clearError('#jobNumber', '#jobNumberError');
    }
  });

  $('#autoJob').on('change', function(){
    if($(this).is(':checked')){
      clearError('#jobNumber', '#jobNumberError');
    } else {
      const value = $('#jobNumber').val().trim();
      if(value === ''){
        showError('#jobNumber', '#jobNumberError', 'Job Number is required.');
      } else if(!/^\d{6}$/.test(value)){
        showError('#jobNumber', '#jobNumberError', 'Job Number must be exactly 6 digits.');
      } else {
        clearError('#jobNumber', '#jobNumberError');
      }
    }
  });

  $('#customerName').on('blur', function(){
    const value = $(this).val().trim();
    if(value === ''){
      showError('#customerName', '#customerNameError', 'Customer Name is required.');
    } else if(value.length < 2){
      showError('#customerName', '#customerNameError', 'Customer Name must contain a minimum of 2 characters.');
    } else {
      clearError('#customerName', '#customerNameError');
    }
  });

  $('#customerPhone').on('blur', function(){
    const phone = $(this).val().trim();
    if(phone === ''){
      showError('#customerPhone', '#customerPhoneError', 'Phone Number is required.');
    } else if(!/^\d+$/.test(phone)){
      showError('#customerPhone', '#customerPhoneError', 'Customer Phone must contain only numeric characters.');
    } else if(phone.length < 9){
      showError('#customerPhone', '#customerPhoneError', 'Customer Phone must contain a minimum of 9 digits.');
    } else if(phone.length > 12){
      showError('#customerPhone', '#customerPhoneError', 'Customer Phone cannot exceed 12 digits.');
    } else {
      clearError('#customerPhone', '#customerPhoneError');
    }
  });

  $('#customerEmail').on('blur', function(){
    const value = $(this).val().trim();
    if(value === ''){
      showError('#customerEmail', '#customerEmailError', 'Email is required.');
    } else if(!/^\S+@\S+\.\S+$/.test(value)){
      showError('#customerEmail', '#customerEmailError', 'Enter a valid email address.');
    } else {
      clearError('#customerEmail', '#customerEmailError');
    }
  });

  $('#customerTenancy').on('blur', function(){
    const value = $(this).val().trim();
    if(value === ''){
      showError('#customerTenancy', '#customerTenancyError', 'Tenancy / Shop is required.');
    } else {
      clearError('#customerTenancy', '#customerTenancyError');
    }
  });

  $('#assetDescriptionSelect').on('change', function(){
    if($(this).val() === 'other'){
      $('#assetDescriptionInput').removeClass('d-none');
    } else {
      $('#assetDescriptionInput')
        .addClass('d-none')
        .removeClass('is-invalid')
        .val('');
      $('#assetDescriptionInputError').text('');
    }
  });

  $('#assetLocation').on('change', function(){
    if($(this).val() === 'other'){
      $('#assetLocationInput').removeClass('d-none');
    } else {
      $('#assetLocationInput')
        .addClass('d-none')
        .removeClass('is-invalid')
        .val('');
      $('#assetLocationInputError').text('');
    }
  });

  $('#assetDescriptionInput').on('blur', function(){
    if($('#assetDescriptionSelect').val() === 'other' && $(this).val().trim() === ''){
      showError('#assetDescriptionInput', '#assetDescriptionInputError', 'Please enter Asset Description.');
    } else {
      clearError('#assetDescriptionInput', '#assetDescriptionInputError');
    }
  });

  $('#assetLocationInput').on('blur', function(){
    if($('#assetLocation').val() === 'other' && $(this).val().trim() === ''){
      showError('#assetLocationInput', '#assetLocationInputError', 'Please enter Asset Location.');
    } else {
      clearError('#assetLocationInput', '#assetLocationInputError');
    }
  });

  $('#technicians').on('blur', function(){
    const tech = Number($(this).val() || 0);
    if(!Number.isInteger(tech) || tech < 1 || tech > 10){
      showError('#technicians', '#techniciansError', 'No. of technicians must be between 1 and 10.');
    } else {
      clearError('#technicians', '#techniciansError');
    }
  });

  $('#hours').on('blur', function(){
    const hrs = Number($(this).val() || 0);
    if(isNaN(hrs) || hrs < 0.1 || hrs > 24){
      showError('#hours', '#hoursError', 'Hours required must be between 0 and 24.');
    } else {
      clearError('#hours', '#hoursError');
    }
  });

  $(document).on('blur', '.fault-desc', function(){
    const $field = $(this);
    const $error = $field.closest('.fault-card').find('.fault-desc-error');
    const value = $field.val().trim();

    if(value === ''){
      showError($field, $error, 'Fault Description is required.');
    } else {
      clearError($field, $error);
    }
  });

  $(document).on('blur', '.work-req', function(){
    const $field = $(this);
    const $error = $field.closest('.fault-card').find('.work-req-error');
    const value = $field.val().trim();

    if(value === ''){
      showError($field, $error, 'Work required is required.');
    } else if(value.length > 150){
      showError($field, $error, 'Work required cannot exceed 150 characters.');
    } else {
      clearError($field, $error);
    }
  });

  $(document).on('blur', '.parts', function(){
    const $field = $(this);
    const $error = $field.closest('.fault-card').find('.parts-error');
    const value = $field.val().trim();

    if(value === ''){
      showError($field, $error, 'Parts & material is required.');
    } else if(value.length > 150){
      showError($field, $error, 'Parts & material cannot exceed 150 characters.');
    } else {
      clearError($field, $error);
    }
  });

  $(document).on('blur', '.equipment', function(){
    const $field = $(this);
    const $error = $field.closest('.fault-card').find('.equipment-error');
    const value = $field.val().trim();

    if(value === ''){
      showError($field, $error, 'Special equipment is required.');
    } else if(value.length > 150){
      showError($field, $error, 'Special equipment cannot exceed 150 characters.');
    } else {
      clearError($field, $error);
    }
  });

  $('input, textarea, select').on('input change', function(){
    const $field = $(this);

    if($field.hasClass('is-invalid')){
      $field.removeClass('is-invalid');
    }

    if($field.hasClass('fault-desc')){
      $field.closest('.fault-card').find('.fault-desc-error').text('');
    } else if($field.hasClass('work-req')){
      $field.closest('.fault-card').find('.work-req-error').text('');
    } else if($field.hasClass('parts')){
      $field.closest('.fault-card').find('.parts-error').text('');
    } else if($field.hasClass('equipment')){
      $field.closest('.fault-card').find('.equipment-error').text('');
    } else if($field.attr('id')){
      $('#' + $field.attr('id') + 'Error').text('');
    }
  });


  // Faults
  function updateAiLabelState($card){
    const hasAutoFilled = $card.find('.work-req').val().trim() !== '' ||
      $card.find('.parts').val().trim() !== '' ||
      $card.find('.equipment').val().trim() !== '';
    $card.find('.ai-pre-fill').toggleClass('is-filled', hasAutoFilled);
  }

  function renderFaults(){
    const $list = $('#faultList').empty();
    jobData.faults.forEach((f,idx)=>{
      const num = idx+1;
      const expanded = f.expanded !== false;
      const $card = $(`
        <div class="fault-card ${expanded ? 'expanded' : 'collapsed'}" data-idx="${idx}">
          <div class="fault-header" role="button" tabindex="0" aria-expanded="${expanded}">
            <div>
              <span class="badge fault-badge">${num}</span>
              Fault #${num}
            </div>
            <div class="d-flex align-items-center gap-2">
              <span class="collapse-indicator">${expanded ? '▾' : '▸'}</span>
              ${jobData.faults.length>1?'<button id="deleteFaultBtn" type="button" class="delete-icon-btn" aria-label="Delete fault"><i class="fa-solid fa-trash"></i></button>':''}
            </div>
          </div>
          <div class="fault-body" ${expanded ? '' : 'style="display:none;"'}>
            <div class="mb-2">
              <label class="form-label">Fault description</label>
              <textarea class="form-control auto-resize fault-desc" rows="3" maxlength="150"
                placeholder="Describe the fault">${f.description||''}</textarea>
              <div class="invalid-feedback fault-desc-error"></div>
            </div>

            <div class="row-1 g-2">
              <div class="mb-2">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="form-label mb-0">Work required</label>
                  <div>
                    <img class="image-for-label" src="images/ai_icon.png" alt="lable">
                    <span class="ai-pre-fill auto-fill small">AI pre-filled — verify</span>
                  </div>
                </div>
                <input maxlength="150" class="form-control work-req" placeholder="AI recommended / enter" value="${f.work||''}">
                <div class="invalid-feedback work-req-error"></div>
              </div>

              <div class="row">
                <div class="col-6 mb-2">
                  <label class="form-label">Parts & material</label>
                  <input maxlength="150" class="form-control parts" placeholder="AI recommended" value="${f.parts||''}">
                  <div class="invalid-feedback parts-error"></div>
                </div>
                <div class="col-6 mb-2">
                  <label class="form-label">Special equipment</label>
                  <input maxlength="150" class="form-control equipment" placeholder="AI recommended" value="${f.equipment||''}">
                  <div class="invalid-feedback equipment-error"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `);
      $list.append($card);
      updateAiLabelState($card);
    });
  }

  function addFault(autos=false){
    jobData.faults.forEach(f => f.expanded = false);
    jobData.faults.push({description:'',work:'',parts:'',equipment:'',expanded:true});
    renderFaults();
  }

  $(document).on('click','#deleteFaultBtn',function(){
    const idx = Number($(this).closest('.fault-card').data('idx'));
    if(!isNaN(idx)){
      jobData.faults.splice(idx,1);
      renderFaults();
    }
  });

  $(document).on('click', '.fault-header', function(e){
    if ($(e.target).closest('button,input,textarea,select,textarea,button,svg,i').length) return;
    const $card = $(this).closest('.fault-card');
    const idx = Number($card.data('idx'));

    if (!isNaN(idx)) {
      jobData.faults.forEach((fault, faultIdx) => {
        fault.expanded = faultIdx === idx ? !fault.expanded : false;
      });
      renderFaults();
    }
  });

  $(document).on('input', '.fault-desc', function () {
    const text = $(this).val().trim().toLowerCase();

    if (text === 'leak') {
      const idx = Number($(this).closest('.fault-card').data('idx'));
      if (!isNaN(idx)) {
        const autoDescription = 'Leak from valve causing water ingress.';
        const autoWork = 'Replace valve and test system.';
        const autoParts = 'Valve assembly, sealant';
        const autoEquipment = 'Socket set, pressure tester';

        jobData.faults[idx].description = autoDescription;
        jobData.faults[idx].work = autoWork;
        jobData.faults[idx].parts = autoParts;
        jobData.faults[idx].equipment = autoEquipment;

        const $card = $(this).closest('.fault-card');
        $card.find('.fault-desc').val(autoDescription);
        $card.find('.work-req').val(autoWork);
        $card.find('.parts').val(autoParts);
        $card.find('.equipment').val(autoEquipment);

        updateAiLabelState($card);
        $card.find('.fault-desc').trigger('input');
      }
    }
  });


  // $(document).on('click','.auto-fill',function(){
  //   const idx = Number($(this).closest('.fault-card').data('idx'));
  //   if(!isNaN(idx)){
  //     jobData.faults[idx].description = 'Leak from valve causing water ingress.';
  //     jobData.faults[idx].work = 'Replace valve and test system.';
  //     jobData.faults[idx].parts = 'Valve assembly, sealant';
  //     jobData.faults[idx].equipment = 'Socket set, pressure tester';
  //     renderFaults();
  //   }
  // });

  // keep model in sync on input change
  $(document).on('input','.fault-desc',function(){
    const idx = Number($(this).closest('.fault-card').data('idx'));
    if(!isNaN(idx)) jobData.faults[idx].description = $(this).val();
  });
  $(document).on('input','.work-req',function(){
    const idx = Number($(this).closest('.fault-card').data('idx'));
    if(!isNaN(idx)) jobData.faults[idx].work = $(this).val();
    updateAiLabelState($(this).closest('.fault-card'));
  });
  $(document).on('input','.parts',function(){
    const idx = Number($(this).closest('.fault-card').data('idx'));
    if(!isNaN(idx)) jobData.faults[idx].parts = $(this).val();
    updateAiLabelState($(this).closest('.fault-card'));
  });
  $(document).on('input','.equipment',function(){
    const idx = Number($(this).closest('.fault-card').data('idx'));
    if(!isNaN(idx)) jobData.faults[idx].equipment = $(this).val();
    updateAiLabelState($(this).closest('.fault-card'));
  });

  $('#addFaultBtn').click(function(){addFault();});

  // initial
  addFault();

  // Estimates calculations
  function calculate(){
    const technicians = Number($('#technicians').val()||0);
    const apprentice = Number($('#apprentice').val()||0);
    const tech = technicians + apprentice;
    const hrs = Number($('#hours').val()||0);
    const man = (tech*hrs).toFixed(2);
    const totalTech = tech + apprentice;
    $('#statTech').text(tech||'-');
    $('#statHours').text(hrs||'-');
    $('#statManHours').text(isNaN(man)?'-':man);
    jobData.estimates.technicians = tech;
    jobData.estimates.hours = hrs;
    jobData.estimates.apprentice = $('#apprentice').is(':checked');
    jobData.estimates.afterHours = $('#afterHours').is(':checked');
  }
  $('#technicians,#hours,#apprentice,#afterHours').on('input change',calculate);

  // Photo upload
  let photoFiles = [];
  function renderPreviews(){
    const $grid = $('#previewGrid').empty();
    if(photoFiles.length===0){
      $("#uploadStatus").text("");
      $("#uploadStatus").hide();
      //$grid.html('<div class="text-muted small">No images uploaded</div>')
      ;return
    } else {
      $("#uploadStatus").text(`${photoFiles.length} image(s) uploaded successfully`);
      $("#uploadStatus").show();
    }
    photoFiles.forEach((f,idx)=>{
      const url = URL.createObjectURL(f);
      const $item = $(`<div class="position-relative">
        <img src="${url}" class="preview-thumb">
        <button type="button" class="btn-sm btn-danger remove-photo" data-idx="${idx}" style="position:absolute;top:-6px;right:-6px;border-radius:50%">&times;</button>
      </div>`);
      $grid.append($item);
    });
  }

 $('#dropZone').on('click', function (e) {
    //if (e.target !== this) return;
    $('#photoInput').trigger('click');
  });

  // stop clicks on the input bubbling up (defensive)
  $('#photoInput').on('click', function (e) { e.stopPropagation(); });

  $('#photoInput').on('change', function (e) {
    const files = Array.from(e.target.files || []);
    const clearInput = () => { 

      try { this.value = ''; } catch (_) { $(this).val(''); } 
    };

    if (files.length === 0) { clearInput(); return; }

    const spaceLeft = MAX_PHOTOS - photoFiles.length;
    if (spaceLeft <= 0) {
      alert(`Only ${MAX_PHOTOS} images allowed`);
      clearInput();
      return;
    }

    if (files.length > spaceLeft) {
      alert(`Only ${spaceLeft} more image(s) can be added (max ${MAX_PHOTOS})`);
    }

    const allowed = files.slice(0, spaceLeft);
    allowed.forEach(f => photoFiles.push(f));
    jobData.photos = photoFiles.slice();
    renderPreviews();
    clearInput();
  });

  // drag drop
  $('#dropZone').on('dragover',function(e){ e.preventDefault(); $(this).addClass('dragover');});
  $('#dropZone').on('dragleave',function(e){ e.preventDefault(); $(this).removeClass('dragover');});
  $('#dropZone').on('drop',function(e){ e.preventDefault(); $(this).removeClass('dragover');
    const dt = e.originalEvent.dataTransfer; if(dt && dt.files){
      const files = Array.from(dt.files);
      const allowed = files.slice(0, MAX_PHOTOS - photoFiles.length);
      allowed.forEach(f=>photoFiles.push(f));
      jobData.photos = photoFiles.slice();
      renderPreviews();
    }
  });

  $(document).on('click','.remove-photo',function(){
    const idx = Number($(this).data('idx'));
    if(!isNaN(idx)){
      photoFiles.splice(idx,1);
      jobData.photos = photoFiles.slice();
      renderPreviews();
    }
  });

  // Navigation
  $('#nextBtn').on('click', function(e){
    if(currentStep < 2){
      if(!validateStep(currentStep)){
        e.preventDefault();
        return false;
      }
      saveStepData(currentStep);
      showStep(currentStep + 1);
    } else {
      if(!validateStep(2)) return;
      saveStepData(2);
      submitJob();
    }
  });

  $('#backBtn').click(function(){
    if(currentStep>0){ showStep(currentStep-1); }
  });

  $('#createNewBtn').on('click', function(){
    resetWizard();
  });

  $('.step').click(function(){ const idx = Number($(this).data('step')); if(idx<=currentStep) showStep(idx); });

  function validateStep(idx){
    if(idx === 0) return validateStep0();
    if(idx === 1) return validateStep1();
    if(idx === 2){
      const tech = Number($('#technicians').val() || 0);
      const hrs = Number($('#hours').val() || 0);
      let valid = true;

      if(!Number.isInteger(tech) || tech < 1 || tech > 10){
        showError('#technicians', '#techniciansError', 'No. of technicians must be between 1 and 10.');
        valid = false;
      } else {
        clearError('#technicians', '#techniciansError');
      }

      if(isNaN(hrs) || hrs < 0.1 || hrs > 24){
        showError('#hours', '#hoursError', 'Hours required must be between 0 and 24.');
        valid = false;
      } else {
        clearError('#hours', '#hoursError');
      }

      return valid;
    }
    return true;
  }

  function saveStepData(idx){
    if(idx===0){
      jobData.customer.jobNumber = $('#jobNumber').val().trim();
      jobData.customer.name = $('#customerName').val().trim();
      jobData.customer.phone = $('#customerPhone').val().trim();
      jobData.customer.email = $('#customerEmail').val().trim();
      jobData.customer.tenancy = $('#customerTenancy').val().trim();
      jobData.customer.notes = $('#customerNotes').val().trim();
    }
    if(idx===1){
      const selectedDescription = $('#assetDescriptionSelect').val();
      const selectedLocation = $('#assetLocation').val();
      jobData.asset.description = selectedDescription === 'other'
        ? $('#assetDescriptionInput').val().trim()
        : selectedDescription;
      jobData.asset.location = selectedLocation === 'other'
        ? $('#assetLocationInput').val().trim()
        : selectedLocation;
      // faults already bound
    }
    if(idx===2){
      jobData.estimates.technicians = Number($('#technicians').val()||0);
      jobData.estimates.hours = Number($('#hours').val()||0);
      jobData.estimates.apprentice = $('#apprentice').is(':checked');
      jobData.estimates.afterHours = $('#afterHours').is(':checked');
    }
  }

  function renderReview(){
    $('#revJob').text(jobData.customer.jobNumber || '-');
    $('#revCustomer').text(jobData.customer.name || '-');
    $('#revAsset').text(jobData.asset.description || '-');
    $('#revFaults').text(`${jobData.faults.length} fault${jobData.faults.length===1?'':'s'}`);
    $('#revTech').text(jobData.estimates.technicians || '-');
    $('#revHours').text(jobData.estimates.hours || '-');
    $('#revMan').text((jobData.estimates.technicians * jobData.estimates.hours) || '-');
  }

  function submitJob(){
    saveStepData(0); saveStepData(1); saveStepData(2);
    const payload = {
      customer: jobData.customer,
      asset: jobData.asset,
      faults: jobData.faults,
      estimates: jobData.estimates,
      photos: jobData.photos.map((f,i)=>({name:f.name,size:f.size,type:f.type}))
    };
    const json = JSON.stringify(payload,null,2);
    $('#modalJobNum').text(jobData.customer.jobNumber||'');
    $('#modalCustomer').text(jobData.customer.name||'');
    $('#modalTime').text(new Date().toLocaleString());
    $('#jsonOutput').text(json);
    const modal = new bootstrap.Modal(document.getElementById('submitModal'));
    modal.show();

    $('#downloadJson').off('click').on('click',function(){
      const blob = new Blob([json],{type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${(jobData.customer.jobNumber||'job').replace(/[^a-z0-9\-]/gi,'_')}.json`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });
  }

  // initialize
  showStep(0);
  calculate();

  // auto-resize for textareas
  $(document).on('input','.auto-resize',function(){ this.style.height='auto'; this.style.height = (this.scrollHeight) + 'px'; });

});
