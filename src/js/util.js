function eltWithClasses(eltName, ...classes) {
    const elt = document.createElement(eltName);
    elt.classList.add(...classes);
    return elt;
}

const div = ((...classes) => eltWithClasses('div', ...classes));
const span = ((...classes) => eltWithClasses('span', ...classes));


export { div, span };