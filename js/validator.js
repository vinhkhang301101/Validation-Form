function Validator(options) {
    var selectorRules = {};
    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    // Thực hiện validate
    function validate(inputElement, rule) {
        var errorElement = getParent(inputElement, options.formGroup).querySelector(options.error);
        var errorMessage;

        // Lấy rule từ selector
        var rules = selectorRules[rule.selector];

        // Check lỗi theo từng rule và dừng khi có lỗi
        for (var i = 0; i < rules.length; ++i) {
            switch(inputElement.type) {
                case 'checkbox':
                case 'radio':
                    errorMessage = rules[i](inputElement.value + ':checked');  
                    break;                  
                default:
                    errorMessage = rules[i](inputElement.value);
            }
            if (errorMessage) break;
        }

        if(errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement, options.formGroup).classList.add('invalid');
        } else {
            errorElement.innerText = '';
            getParent(inputElement, options.formGroup).classList.remove('invalid');
        }

        return !errorMessage;
    }

    // Lấy element của form cần validate
    var formElement = document.querySelector(options.form);
    if (formElement) {
        var isFormValid = true;

        // Submit form and validate
        formElement.onsubmit = function(e) {
            e.preventDefault();
            options.rules.forEach(function(rule) {
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = validate(inputElement, rule);
                if (!isValid) {
                    isFormValid = false;
                }
            });

            if (isFormValid) {
                if (typeof options.onSubmit == 'function') {
                    var allInputs = formElement.querySelectorAll('[name]');
                    var formValues = Array.from(allInputs).reduce((values, input) => {
                        switch (input.type) {
                            case 'checkbox':
                            case 'radio':
                                if (input,matches(':checked')) {
                                    values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                                } else { 
                                    values[input.name] = '';                                    
                                }
                                break;
                            default:
                                values[input.name] = input.value;
                        }
                        return values;
                    }, {});
                    options.onSubmit(formValues);
                }
            } else {
                formElement.submit();
            }
        }

        // Lặp qua các event
        options.rules.forEach(function (rule) {
            // Lưu rulers
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } else {
                selectorRules[rule.selector] = [rule.test];
            }

            // Báo lỗi khi blur ra ngoài
            var inputElements = formElement.querySelectorAll(rule.selector);
            Array.from(inputElements).forEach(function(inputElement) {
                inputElement.onblur = function () {
                    validate(inputElement, rule);
                }
                inputElement.oninput = function () {
                    var errorElement = getParent(inputElement, options.formGroup).querySelector(options.error);    
                    errorElement.innerText = '';
                    getParent(inputElement, options.formGroup).classList.remove('invalid');
                }                
            });
        })
    }
}

Validator.isRequired = function(selector, messages) {
    return {
        selector: selector,
        test: function(value) {
            return value.trim() ? undefined : messages || 'Please enter this box!';
        }
    }
}

Validator.isEmail = function(selector, messages) {
    return {
        selector: selector,
        test: function(value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : messages || 'Please enter a valid email!'
        }
    }
}

Validator.minLength = function(selector, min, messages) {
    return {
        selector: selector,
        test: function(value) {
            return value.length >= min ? undefined : messages || `Please enter at least ${min} characters`;
        }
    }
}

Validator.isConfirmed = function(selector, getConfirmed, message) {
    return {
        selector: selector,
        test: function(value) {
            return value === getConfirmed() ? undefined : message || 'Wrong value!';
        }
    }
}