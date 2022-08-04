const reorderDOM = (column, e) => {
  const parents = document.querySelectorAll('[data-column-group]');
  let activeIndex = e.target === undefined ? e.toString() : e.target.value; // check if e value is coming from a select option change or initial load
  let currentColumn = column + 1; // skip over rowheaders

  // on initial load, if indexes are already in valid order - do nothing
  if (column === e) return;

  /**
   * Function to perform node swap
   * @param {HTMLElement} target - div being moved into ref's position
   * @param {HTMLElement} ref - div that will swap with target's position
   */
  const swapNodes = (target, ref) => {
    let placeholder = document.createElement('div');
    let marker = 'data-placeholder';
    let q_ = Promise.resolve();
    placeholder.setAttribute(marker, '');

    const queue = (func) => {
      q_ = q_.then(func).catch((error) => console.error('Error thrown in reorderDOM queue:', error));
      return q_;
    }

    const cadence = () => {
      return new Promise((resolve) => {
        setTimeout(resolve, 5);
      });
    }

    const swap = (a, b) => b.parentNode.replaceChild(a, b);

    const cleanup = () => {
      let placeholderElem = document.querySelector(`[${marker}]`);
      if (placeholderElem) placeholderElem.parentNode.removeChild(placeholderElem);
    }

    // set order of operations (important for initial load)
    queue(cadence).then(() => swap(placeholder, target)); // create reference of target columns original spot
    queue(cadence).then(() => swap(target, ref)); // move target column into new position
    queue(cadence).then(() => swap(ref, placeholder)); // move ref column to where placeholder was
    queue(cadence).then(() => cleanup());
  }

  parents.forEach(parent => {
    let targetChild = parent.querySelector(`.product-${activeIndex}`);
    let refChild = parent.children[currentColumn];

    swapNodes(targetChild, refChild);
  });
};

const setChangeEvent = () => {
  const selects = document.querySelectorAll('.selector-dropdown');
  selects.forEach((select, i) => {
    select.addEventListener('change', (e) => reorderDOM(i, e));
  });
}

if (typeof module === 'object' && module.exports) {
  module.exports = reorderDOM
} else {
  setChangeEvent();
}

