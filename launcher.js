const featureItems = document.querySelectorAll('[data-feature]');
const onlineAppUrl = 'https://zx20170910.github.io/format-tools/';

featureItems.forEach((item) => {
  item.addEventListener('click', () => {
    const feature = item.dataset.feature;
    const url = `${onlineAppUrl}#${feature}`;
    chrome.tabs.create({ active: true, url });
    window.close();
  });
});
