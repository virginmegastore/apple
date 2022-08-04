/**
 * Viewport flags - used for local instance and export
 * @type { MediaQueryList }
 */
const viewportSm = window.matchMedia('(max-width: 734px)');
const viewportMd = window.matchMedia('(min-width: 735px) and (max-width: 1068px)');
const viewportLg = window.matchMedia('(min-width: 1069px)');
const viewportArray = [viewportLg, viewportMd, viewportSm];

/**
 * Main controller for non-static dropdowns
 * Includes media query setup for export
 */
function ProductPicker (selectEls) {
  let order = [];
  let defaultProducts = [];
  let newIndexes = {};
  let viewportIndex = 0;
  // get allowed columns to be rendered on the page
  let allowedColumns = parseInt(getComputedStyle(document.querySelector('.channel-compare')).getPropertyValue('--columns')) || 3;
  // get indexes for each column/viewport
  let columnIndexes = getComputedStyle(document.querySelector('.channel-compare')).getPropertyValue('--column-data') || [0,1,2,0,1,2,0,1,2];

  // create array
  let indexCollection = columnIndexes.split(',').map(function(item) {
    return parseInt(item.trim());
  });

  // split array into viewport groups
  const splitArray = (arr, size) => {
    const res = [];
    for (let i = 0; i < arr.length; i += size) {
      const chunk = arr.slice(i, i + size);
      res.push(chunk);
    }
    return res;
  };

  // define default column indexes
  defaultProducts = splitArray(indexCollection, allowedColumns);

  // create this.selectEls array from node list
  this.selectEls = Array.prototype.slice.call(selectEls);

  // populates columns in each row
  this.columns = this.getColumns(this.selectEls[0]);

  /**
   * Loop through each select and setup
   */
  this.selectEls.forEach(function (select, index) {
    let option = select.querySelector('[aria-selected ="true"]');
    let selectedOptions = select.selectedOptions;
    let fallbackValue = select.options[select.selectedIndex].value;

    select.selectedIndex = Array.prototype.slice.call(select.options).indexOf(option);
    option.setAttribute('selected', 'true');

    // set order array
    if (selectedOptions) {
      order.push(parseInt(selectedOptions[0].value));
    } else {
      order.push(parseInt(fallbackValue));
    }

    /**
     * Sets viewport flags and keeps indexes updated accordingly
     * Checks for manual select changes, otherwise refers to defaultProducts
     */
    const setMediaQueries = () => {
      const handleChange = () => {
        viewportArray.forEach((viewport, i) => {
          let currentIndex = selectedOptions ? parseInt(selectedOptions[0].value) : parseInt(fallbackValue);
          // check for viewport matches
          if (viewport.matches) {
            viewportIndex = i;

            // check for new selections
            if (newIndexes.hasOwnProperty(`column${viewportIndex}${index}`)) {
              let newIndex = parseInt(newIndexes[`column${viewportIndex}${index}`]);
              this.update(index, newIndex, currentIndex);
            } else {
              this.update(index, defaultProducts[viewportIndex][index], currentIndex);
            }

            // update order array
            order[index] = currentIndex;
          }
        })
      };

      // attach viewport event listener
      viewportArray.forEach((viewport) => {
        viewport.addEventListener('change', (e) => {
          handleChange(e);
        });
        // on init
        handleChange(viewport);
      });
    };

    setMediaQueries();

    /**
     * Select onchange event handler
     * Checks for index collisions + updates order array and newIndexes obj
     */
    select.onchange = function () {
      let selectedProductIndex = selectedOptions ? parseInt(selectedOptions[0].value) : parseInt(fallbackValue);
      let existingPos = order.slice(0, allowedColumns).indexOf(selectedProductIndex);

      // perform swap - if needed
      if (existingPos > -1) {
        let swapValue =  order[index];
        this.update(existingPos, swapValue, order[existingPos]);
        order[existingPos] = swapValue;
        newIndexes[`column${viewportIndex}${existingPos}`] = swapValue.toString();
      }

      this.update(index, selectedProductIndex, order[index]);
      // update order array
      order[index] = selectedProductIndex;
      // update newIndexes obj
      newIndexes[`column${viewportIndex}${index}`] = selectedProductIndex.toString();
    }.bind(this);

  }.bind(this));

}

let proto = ProductPicker.prototype;

/**
 * Update function - sets active/inactive indexes
 * @param {number} current - column
 * @param {number} nextProductIndex - newly selected index
 * @param {number} currentProductIndex - index to be changed
 */
proto.update = function (current, nextProductIndex, currentProductIndex) {
  if (this.selectEls == null) return;

  let columnClass = 'compare-column-' + current;
  let currentOptionIndex = this.getOptionIndexByValue(currentProductIndex);
  let nextOptionIndex = this.getOptionIndexByValue(nextProductIndex);
  this.selectEls[current].selectedIndex = nextOptionIndex;

  let currentColumns = this.getColumnsByProductIndex(currentProductIndex);
  let nextColumns = this.getColumnsByProductIndex(nextProductIndex);
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
  let columns = [];
  this.valueIndexMap = {}
  let options = Array.prototype.slice.call(parent.querySelectorAll('option'));
  options.forEach(function (option, domOrder){
    let productIndex = option.value;
    this.valueIndexMap[productIndex] = domOrder;
    columns[productIndex] = Array.prototype.slice.call(document.querySelectorAll('.product-' + productIndex));
  }.bind(this));
  return columns;
}

proto.destroy = function () {
  this.selectEls.forEach(function (select){
    select.onchange = null
  }.bind(this))
  this.selectEls = null
}

// local vs export
if (typeof module === 'object' && module.exports) {
  module.exports = { ProductPicker, viewportArray }
} else {
  new ProductPicker(document.querySelectorAll('.selector-dropdown'));
}
