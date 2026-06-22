$(function(){

  // const selector = "#customerNotes, #assetDescriptionInput, #assetLocationInput, .fault-desc";
  // const lineHeight = 22;
  // const maxLines = 4;
  // const maxHeight = lineHeight * maxLines;

  // $(document).on("input", selector, function () {
  //   const $field = $(this);
  //   const previousValue = $field.data("previousValue") || "";

  //   this.style.height = "auto";
  //   this.style.height = this.scrollHeight + "px";

  //   // If content exceeds 3 visual lines
  //   if (this.scrollHeight > maxHeight + 2) {
  //     $field.val(previousValue);

  //     this.style.height = "auto";
  //     this.style.height =
  //       Math.min(this.scrollHeight, maxHeight) + "px";

  //     return;
  //   }

  //   $field.data("previousValue", $field.val());

  //   this.style.height =
  //     Math.min(this.scrollHeight, maxHeight) + "px";
  // });



  // generate job number
  $('#autoJob').on('change', function () {
    if ($(this).is(':checked')) {
      $('#jobNumber').prop('disabled', true).val(generateJobNumber());
    } else { $('#jobNumber').prop('disabled', true).val(''); }
  });
  function generateJobNumber() {
    var num = Math.floor(100000 + Math.random() * 900000).toString();
    return num;
  }

  $('#assetDescriptionSelect').on('change', function(){
    const val = $(this).val();
    if(val === 'other'){
      $('#assetDescriptionInput').removeClass('d-none').focus();
    } else {
      $('#assetDescriptionInput').addClass('d-none').val('');
      // if you keep a jobData model, store selected asset:
      if(typeof jobData !== 'undefined') jobData.asset = val || '';
    }
  });

  // Sync free text into model when user types
  $('#assetDescriptionInput').on('input', function(){
    if(typeof jobData !== 'undefined') jobData.asset = $(this).val();
  });


  $('#assetDescriptionSelect').on('change', function () {
            if ($(this).val() === 'other') {
                $('#assetDescriptionInput')
                    .removeClass('d-none')
                    .focus();
            } else {
                $('#assetDescriptionInput')
                    .addClass('d-none')
                    .val('');
            }
        });

        $('#assetLocation').on('change', function () {
            if ($(this).val() === 'other') {
                $('#assetLocationInput')
                    .removeClass('d-none')
                    .focus();
            } else {
                $('#assetLocationInput')
                    .addClass('d-none')
                    .val('');
            }
        });
});