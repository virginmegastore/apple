"use strict";
/**
 * Injects elements into the DOM based on a data set
 */
const reorderDOM = {
    // Variables
    selectorEls: null,
    headerEl: null,
    capturedEls: null,
    capturedElsQuery: null,
    clonedEls: [],
    cOrder: null,
    cMax: null,
    useStatic: null,
    selectorElsQuery: null,
    staticEl: null,
    staticElQuery: null,
    // Listens for event from manager(s)
    addListeners() {
        window.addEventListener('channel:reorder-dom', (event) => {
            this.useStatic = event.detail.useStatic;
            this.cOrder = event.detail.order;
            this.cMax = event.detail.max;
            this.updateElements();
        });
    },
    // Run update on elements
    updateElements() {
        // Dynamic actions
        (!this.useStatic) && this.updateSelectors();
        (!this.useStatic) && this.updateHeadersAX();
        (!this.useStatic) && this.updateRows();
        // Static actions
        (this.useStatic) && this.updateStatic();
    },
    // Alias for Array.form()
    arrayFromNodeList(els) {
        const arr = [];
        els.forEach(el => {
            arr.push(el);
        });
        return arr;
    },
    // Sorts elements by their flex:order
    // updateDOM
    updateStatic() {
        // (skip header +1)
        this.clonedEls.forEach((clonedEl, cloneIndex) => {
            // Make a copy of the original clone (skip header +1)
            const capturedEl = this.capturedEls[cloneIndex];
            const cloneEl = clonedEl.cloneNode(true);
            const headerEl = cloneEl.querySelector('[role=rowheader]');
            let cellEls = [];
            // Pluck the cells based on cOrder
            this.cOrder.forEach((cItem, cIndex) => {
                // Find by internal index and select container
                const indexQuery = `[index="${cItem}"]`;
                const indexedCell = cloneEl.querySelector(indexQuery);
                const indexOuter = indexedCell.parentElement;
                // Add to prepends
                cellEls.push(indexOuter);
            });
            // Prepend cells by order to each row
            cellEls.reverse().forEach((cellEl, index) => {
                cellEl.setAttribute('added', true);
                cloneEl.prepend(cellEl);
            });
            // Show/hide based on viewport length
            // Skip header
            for (let i = 0; i < cloneEl.children.length; i++) {
                const _celEl = cloneEl.children[i];
                _celEl.style.order = 'unset';
                this.toggleVisibility(_celEl, (i < this.cMax));
            }
            // Float rowheader to top
            cloneEl.prepend(headerEl);
            cloneEl.setAttribute('added', true);
            // Replace content
            capturedEl.innerHTML = cloneEl.innerHTML;
        });
    },
    // Update AX headers
    updateHeadersAX() {
        // AX requires this prefix element
        let updatedHTML = '<div role="columnheader">&nbsp;</div>';
        let selectors = document.querySelectorAll(this.selectorElsQuery);
        // Loop selected and populate rowheader
        selectors.forEach((selectorEl, index) => {
            const selectedOption = selectorEl.querySelector('[selected=true]');
            const labelText = selectedOption.innerText.trim();
            const shown = selectorEl.parentElement.parentElement.style.display === 'flex';
            // Only populates what's visible
            if (shown)
                updatedHTML += `<div role="columnheader">${labelText}</div>`;
        });
        // Update DOMs
        this.headerEl.innerHTML = updatedHTML;
    },
    // Update selector values to match data
    updateSelectors() {
        // Take what is on the stage and replace with those from memory
        // To restore listener states which get replaced on re-render
        const existingSelectors = document.querySelectorAll(this.selectorElsQuery);
        existingSelectors.forEach((existingSelector, index) => {
            existingSelector.replaceWith(this.selectorEls[index]);
        });
        // Update selectors attributes and state
        this.cOrder.forEach((order, index) => {
            // Capture selector
            const selectorEl = this.selectorEls[index];
            // Will select the dropdown
            let selectedIndex = 0;
            // Figure out what should be selected and update attr
            for (let i = 0; i < selectorEl.options.length; i++) {
                const option = selectorEl.options[i];
                const value = Number(option.value);
                const isActive = value === order;
                if (isActive)
                    selectedIndex = i;
                // AX
                option.removeAttribute('selected');
                option.setAttribute('selected', isActive);
                option.removeAttribute('aria-selected');
                option.setAttribute('aria-selected', isActive);
            }
            // Update visual selection
            selectorEl.selectedIndex = selectedIndex;
        });
        // Update selectors visibility
        for (var selIndex = 0; selIndex < this.selectorEls.length; selIndex++) {
            const selectorEl = this.selectorEls[selIndex];
            const selectorBool = selIndex < this.cMax;
            // Select the parent column
            this.toggleVisibility(selectorEl.parentElement.parentElement, selectorBool);
        }
    },
    // Update row element order and visibility
    updateRows() {
        this.clonedEls.forEach((clonedEl, cloneIndex) => {
            // Make a copy of the original clone
            const capturedEl = this.capturedEls[cloneIndex];
            const cloneEl = clonedEl.cloneNode(true);
            const headerEl = cloneEl.querySelector('[role=rowheader]');
            const swapEls = [];
            // Create an array queue based on order
            this.cOrder.forEach((cItem) => {
                const indexQuery = `[index="${cItem}"]`;
                const indexedCell = cloneEl.querySelector(indexQuery);
                const indexOuter = indexedCell.parentElement;
                swapEls.push(indexOuter);
            });
            // Prepend cloneEl with ordered
            swapEls.reverse().forEach(swappedEl => {
                cloneEl.prepend(swappedEl);
            });
            // Show/hide based on viewport length
            // Skip header
            for (let i = 0; i < cloneEl.children.length; i++) {
                const _celEl = cloneEl.children[i];
                _celEl.style.order = 'unset';
                this.toggleVisibility(_celEl, (i < this.cMax));
            }
            // Float header to top
            cloneEl.prepend(headerEl);
            // Update document DOM
            capturedEl.innerHTML = cloneEl.innerHTML;
        });
    },
    // Toggles the visibility for an element
    toggleVisibility(element, bool) {
        element.style.visibility = (bool) ? 'visible' : 'hidden';
        element.style.display = (bool) ? 'flex' : 'none';
        element.style.order = 'unset';
    },
    // Prepare selectors and clones (onload only)
    init(swapEls, selectorEls, headerEl, staticEl, useStatic) {
        // Static flag (must be first)
        this.useStatic = useStatic;
        // Rows to manipulate
        this.capturedEls = document.querySelectorAll(swapEls);
        this.capturedElsQuery = swapEls;
        // AX header
        this.headerEl = document.querySelector(headerEl);
        // Non-static headers
        this.selectorEls = document.querySelectorAll(selectorEls);
        this.selectorElsQuery = selectorEls;
        // Populate the static header array
        this.staticElQuery = staticEl;
        this.staticEl = (this.useStatic) && document.querySelector(this.staticElQuery).cloneNode(true);
        // Static flag
        this.useStatic = useStatic;
        // Cache elements for reflow later
        this.clonedEls = this.arrayFromNodeList(this.capturedEls);
        // Enable listeners
        this.addListeners();
    }
};
/**
 * Manages the viewport state and emits viewport change events
 */
const viewportManager = {
    // Next state
    nState: null,
    // Current state
    cState: null,
    init: function () {
        this.addListeners();
        this.viewportObserve();
    },
    // Listen for window resize
    addListeners: function () {
        window.addEventListener('resize', (event) => {
            this.viewportObserve();
        });
    },
    // Set the state of the window based on constraints
    viewportObserve: function () {
        // Fetch window size and setup vars
        const width = window.innerWidth;
        // Determine state of size
        if (width <= 734)
            this.nState = 'small';
        if (width > 734 && width <= 1068)
            this.nState = 'medium';
        if (width > 1068)
            this.nState = 'large';
        // Check for change & dispatch
        if (this.cState !== this.nState) {
            this.cState = this.nState;
            this.dispatch(this.cState);
        }
    },
    // Dispatches event to manager(s)
    dispatch: function (detail) {
        const event = new CustomEvent('channel:viewport-change', {
            detail
        });
        window.dispatchEvent(event);
    }
};
/**
 * Manages selector state and emits user change events
 */
const selectorManager = {
    init: function (selectorElsQuery, headerEl) {
        // Find selector types
        const selectorEls = document.querySelectorAll(selectorElsQuery);
        // Track user selections
        selectorEls.forEach((selectorEl, elIndex) => {
            selectorEl.addEventListener('change', () => {
                const sIndex = selectorEl.selectedIndex;
                const value = selectorEl.value;
                const selectedIndex = Number(selectorEl.options[sIndex].getAttribute('value'));
                // Emit to the rest of the manager(s)
                this.dispatch({
                    elIndex,
                    selectedIndex,
                    value
                });
            });
        });
    },
    // Dispatches a custom event
    dispatch: function (detail) {
        const event = new CustomEvent('channel:user-select', {
            detail
        });
        window.dispatchEvent(event);
    },
};
/**
 * Manages state based on viewport & select events
 */
const dataManager = {
    // Variables
    order: null,
    viewportKey: null,
    viewportOrder: null,
    viewportMax: null,
    // Initialize with config
    init: function (config, useStatic) {
        // Init data
        this.order = config;
        // Store static mode
        this.useStatic = useStatic;
        // Listeners
        this.addListeners();
    },
    // Listens for viewport change event from manager(s)
    viewportChange(viewportKey) {
        this.viewportKey = viewportKey;
        // Determine order for viewport
        this.viewportOrder = this.order[this.viewportKey];
        this.viewportMax = this.order.max[this.viewportKey];
        // Notify manager(s)
        this.dispatch({
            order: this.viewportOrder,
            max: this.viewportMax,
            useStatic: this.useStatic
        });
    },
    // Make the current viewport order override all
    flattenOrders() {
        this.viewportOrder = this.order[this.viewportKey];
        this.viewportMax = this.order.max[this.viewportKey];
        // Make all viewports the same value of currently loaded one
                ['small', 'medium', 'large'].forEach((viewport) => {
            this.order[viewport] = this.viewportOrder;
        });
    },
    // Listens for user select event from manager(s)
    userSelect(state) {
        // Extract event info vars
        const {
            elIndex,
            selectedIndex
        } = state;
        // Store values for swap
        const currValue = this.viewportOrder[elIndex];
        // Offset order to match values
        const existingValue = this.viewportOrder.find(existingItem => {
            return existingItem === selectedIndex;
        });
        const existingValueIndex = this.viewportOrder.indexOf(existingValue);
        // If exists swap it around or just overwrite
        if (undefined !== existingValue) {
            this.viewportOrder[existingValueIndex] = currValue;
            this.viewportOrder[elIndex] = existingValue;
        } else {
            this.viewportOrder[elIndex] = selectedIndex;
        }
        // Flatten orders
        this.flattenOrders();
        this.dispatch({
            order: this.viewportOrder,
            max: this.viewportMax,
            useStatic: this.useStatic
        });
    },
    // Listeners for events from manager(s)
    addListeners: function () {
        window.addEventListener('channel:user-select', (event) => {
            this.userSelect(event.detail);
        });
        window.addEventListener('channel:user-refresh', (event) => {
            this.dispatch({
                order: this.viewportOrder,
                max: this.viewportMax,
                useStatic: this.useStatic
            });
        });
        window.addEventListener('channel:viewport-change', (event) => {
            this.viewportChange(event.detail);
        });
    },
    // Dispatches event to manager(s)
    dispatch: function (detail) {
        const reorderEvt = new CustomEvent('channel:reorder-dom', {
            detail
        });
        window.dispatchEvent(reorderEvt);
    }
};
// Bootstrapper
const channelCompare = {
    inited: false,
    init: function (config = null) {
        // bf-cache buster
        if (this.inited)
            return;
        this.isDev = window.location.host.indexOf('127.0.0.1') > -1;
        let configData;
        // If `config` exists, use it and start the manager(s) else
        // Try to find element [data-channel-html-compare] or report invalid
        // Attempt to parse or report invalid
        // If successful start the manager(s)
        if (!!config) {
            configData = config;
        } else if (!config) {
            const dataEl = document.querySelector("[data-channel-html-compare]");
            if (!dataEl) {
                console.warn('channelCompare: element[data-channel-html-compare not found]');
                return;
            }
            try {
                const attribute = dataEl.getAttribute("data-channel-html-compare");
                configData = JSON.parse(attribute);
            } catch (e) {
                console.warn('channelCompare: error parsing JSON', e);
                return;
            }
        }
        console.log('channelCompare.init.configData', configData);
        // Extract props for manager(s)
        const order = configData.order;
        const headerEl = configData.headerEl;
        const selectorEls = configData.selectorEls;
        const swapEls = configData.swapEls;
        const staticEl = configData.staticEl;
        const useStatic = configData.useStatic;
        // Start managers (the order matters)
        reorderDOM.init(swapEls, selectorEls, headerEl, staticEl, useStatic);
        // Only attach listeners in non-static mode
        (!useStatic) && selectorManager.init(selectorEls);
        dataManager.init(order, useStatic);
        viewportManager.init();
        // Init once
        this.inited = true;
    }
};
const compareEl = document.querySelector('.compare');
compareEl.style.visibility = 'hidden';
// Wait for page to load
window.addEventListener('pageshow', (event) => {
    // Check if we're using back-forward caching
    const {
        persisted
    } = event;
    // Init if not cached
    if (!persisted) {
        channelCompare.init();
        compareEl.style.visibility = 'visible';
    } else {
        // Refresh render
        window.addEventListener('scroll', () => {
            const reorderEvt = new CustomEvent('channel:user-refresh');
            window.dispatchEvent(reorderEvt);
        });
    }
});
