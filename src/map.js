import { loadList, loadDetails } from './api';
import { getDetailsContentLayout } from './details';
import { createFilterControl, isClusterContainsInActiveStation } from './filter';

export default function initMap(ymaps, containerId) {
  const myMap = new ymaps.Map(containerId, {
    center: [55.76, 37.64],
    controls: [], // TODO: check this parametr later, don't see it in docs
    zoom: 10
  });

  const objectManager = new ymaps.ObjectManager({
    clusterize: true,
    gridSize: 64,
    clusterIconLayout: 'default#pieChart',
    clusterDisableClickZoom: false,
    geoObjectOpenBalloonOnClick: false,
    geoObjectHideIconOnBalloonOpen: false,
    geoObjectBalloonContentLayout: getDetailsContentLayout(ymaps)
  });

  myMap.geoObjects.add(objectManager);

  loadList().then(data => {
    objectManager.add(data);
    initClustersColor(objectManager.clusters);
  });

  // details
  objectManager.objects.events.add('click', event => {
    const objectId = event.get('objectId');
    const obj = objectManager.objects.getById(objectId);

    objectManager.objects.balloon.open(objectId);

    if (!obj.properties.details) {
      loadDetails(objectId).then(data => {
        obj.properties.details = data;
        objectManager.objects.balloon.setData(obj);
      });
    }
  });

  // filters
  const listBoxControl = createFilterControl(ymaps);
  myMap.controls.add(listBoxControl);

  var filterMonitor = new ymaps.Monitor(listBoxControl.state);
  filterMonitor.add('filters', filters => {
    objectManager.setFilter(
      obj => filters[obj.isActive ? 'active' : 'defective']
    );
  });

  myMap.events.add('boundschange', () => {
    initClustersColor(objectManager.clusters);
  })

  function initClustersColor (clustersArr) {
    clustersArr.each(cluster => {
      if (isClusterContainsInActiveStation(cluster.features)) {
        changeClusterColorToRed(cluster.id);
      } else {
        changeClusterColorToGreen(cluster.id);
      }
    });
  }

  function changeClusterColorToGreen (objectId) {
      objectManager.clusters.setClusterOptions(objectId, {
          preset: 'islands#greenClusterIcons'
      });
  }

  function changeClusterColorToRed (objectId) {
      objectManager.clusters.setClusterOptions(objectId, {
          preset: 'islands#redClusterIcons'
      });
  }

}
