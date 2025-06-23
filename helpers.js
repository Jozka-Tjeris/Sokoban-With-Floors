import * as THREE from 'three';

export function addPositionToItem(item, x, y, z){
    item.position.x += x;
    item.position.y += y;
    item.position.z += z;
}

export function setPositionToItem(item, x, y, z){
    item.position.x = x;
    item.position.y = y;
    item.position.z = z;
}

export function QRotateDegreesObject3DAxis(item, axis, angle){
    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(axis, THREE.MathUtils.degToRad(angle));
    item.applyQuaternion(quaternion);
}

export function applyIsometricRotation(item){
    QRotateDegreesObject3DAxis(item, new THREE.Vector3(0, 1, 0), -45);
    QRotateDegreesObject3DAxis(item, new THREE.Vector3(1, 0, 0), 45);
}
