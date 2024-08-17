import ThumbnailsPersistence from "src/thumbnails/persistence/ThumbnailsPersistence";
import {getBytes, ref, uploadString, deleteObject} from "firebase/storage";
import FirebaseServices from "src/services/firebase/FirebaseServices";
import {useAuthStore} from "stores/authStore";

class FirestoreThumbnailsPersistence extends ThumbnailsPersistence {

  async init() {
    console.debug(` ...initialized notes: ${this.getServiceName()}`,'✅' )
    return Promise.resolve("")
  }

  saveThumbnail(tabId: string, thumbnail: string): Promise<void> {
    console.log(`saving Thumbnail ${tabId}`)
    this.saveBlobToStorage(tabId, thumbnail);
    return Promise.resolve()
  }

  async getThumbnail(tabId: string): Promise<string> {
    const storageReference = ref(FirebaseServices.getStorage(), `users/${useAuthStore().user.uid}/thumbnails/${tabId}`);
    const res = await getBytes(storageReference)
    var decoder = new TextDecoder("utf-8");
    return decoder.decode(res)
  }

  cleanUpThumbnails(fnc: (url: string) => boolean): Promise<void> {
    return Promise.reject("cleanUpThumbnails not implemented in FirestoreThumbnailsPersistence");
  }

  async deleteThumbnail(tabId: string): Promise<void> {
    const storageReference = ref(FirebaseServices.getStorage(), `users/${useAuthStore().user.uid}/thumbnails/${tabId}`);
    await deleteObject(storageReference)
    return Promise.resolve()
  }

  private saveBlobToStorage(tabId: string, data: string) {
    const storageReference = ref(FirebaseServices.getStorage(), `users/${useAuthStore().user.uid}/thumbnails/${tabId}`);
    uploadString(storageReference, data).then((snapshot: any) => {
      console.log('Uploaded thumbnail!');
    });
    return tabId;
  }


}

export default new FirestoreThumbnailsPersistence()
