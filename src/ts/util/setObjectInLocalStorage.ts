export function setObjectInLocalStorage<T>(key: string, object: T) {
    window.localStorage.setItem(key, JSON.stringify(object));
}

export function getObjectInLocalStorage<T>(key: string, object?: T, callbackFunction?: (object: T) => void) {
    const localStorage = window.localStorage.getItem(key);
    if (
        localStorage !== null
        && localStorage !== 'undefined'
        && localStorage !== ''
    ) {
        return JSON.parse(localStorage);
    }
}