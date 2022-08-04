function ProductPicker (selectEls) {
  // get allowed columns to be rendered on the page
  var allowedColumns = getComputedStyle(document.querySelector('.channel-compare')).getPropertyValue('--columns') || 3;

  var order = [];
  this.selectEls = Array.prototype.slice.call(selectEls);

  //populates columns in each row
  this.columns = this.getColumns(this.selectEls[0]);

  this.selectEls.forEach(function (select, index) {
    select.onchange = function (){

      var selectedProductIndex = select.selectedOptions? select.selectedOptions[0].value : select.options[select.selectedIndex].value;
      selectedProductIndex = parseInt(selectedProductIndex);

      var existingPos = order.slice(0, allowedColumns).indexOf(selectedProductIndex);
      if (existingPos > -1) {
        var swapValue =  order[index];
        this.update(existingPos, swapValue, order[existingPos]);
        order[existingPos] = swapValue;
      }

      this.update(index, selectedProductIndex, order[index]);
      order[index] = selectedProductIndex;
    }.bind(this);

    var option = select.querySelector('[aria-selected ="true"]');
    select.selectedIndex = Array.prototype.slice.call(select.options).indexOf(option);
    option.setAttribute('selected', 'true');

    var selectedOptions = select.selectedOptions;
    if(selectedOptions) {
      order.push(parseInt(selectedOptions[0].value));
    } else {
      order.push(parseInt(select.options[select.selectedIndex].value));
    }
  }.bind(this));
}

var proto = ProductPicker.prototype;

proto.update = function (current, nextProductIndex, currentProductIndex) {
  var columnClass = 'compare-column-' + current;
  var currentOptionIndex = this.getOptionIndexByValue(currentProductIndex);
  var nextOptionIndex = this.getOptionIndexByValue(nextProductIndex);
  this.selectEls[current].selectedIndex = nextOptionIndex;

  var currentColumns = this.getColumnsByProductIndex(currentProductIndex);
  var nextColumns = this.getColumnsByProductIndex(nextProductIndex);
  currentColumns.forEach( function(el, index){
    el.classList.remove(columnClass);
    nextColumns[index].classList.add(columnClass);
  });

  this.selectEls[current].options[currentOptionIndex].removeAttribute('aria-selected');
  this.selectEls[current].options[currentOptionIndex].removeAttribute('selected');

  this.selectEls[current].options[nextOptionIndex].setAttribute('aria-selected', 'true');
  this.selectEls[current].options[nextOptionIndex].setAttribute('selected', 'true');
}
proto.getOptionIndexByValue = function (value) {
  return this.valueIndexMap[value];
}
proto.getColumnsByProductIndex = function (productIndex) {
  return this.columns[productIndex];
}
proto.getColumns = function (parent) {
  var columns = [];
  this.valueIndexMap = {}
  var options = Array.prototype.slice.call(parent.querySelectorAll('option'));
  options.forEach(function (option, domOrder){
    var productIndex = option.value;
    this.valueIndexMap[productIndex] = domOrder;
    columns[productIndex] = Array.prototype.slice.call(document.querySelectorAll('.product-' + productIndex));
  }.bind(this));
  return columns;
}

proto.destroy = function (){
  this.selectEls.forEach(function (select){
    select.onchange = null
  }.bind(this))
  this.selectEls = null
}

if(typeof module === 'object' && module.exports) {
  module.exports = ProductPicker
} else {
  new ProductPicker(document.querySelectorAll('.selector-dropdown'));
}
