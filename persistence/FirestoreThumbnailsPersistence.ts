import { doc, setDoc } from 'firebase/firestore'
import { deleteObject, getBytes, getMetadata, listAll, ref, uploadString } from 'firebase/storage'
import FirebaseServices from 'src/services/firebase/FirebaseServices'
import ThumbnailsPersistence from 'src/thumbnails/persistence/ThumbnailsPersistence'
import { useAuthStore } from 'stores/authStore'

class FirestoreThumbnailsPersistence extends ThumbnailsPersistence {
  async init() {
    // console.debug(` ...initialized thumbnails: ${this.getServiceName()}`, '✅')
    return Promise.resolve('')
  }

  saveThumbnail(tabId: string, thumbnail: string): Promise<void> {
    //console.log(`saving Thumbnail ${tabId}`)
    this.saveBlobToStorage(tabId, thumbnail)
    this.updateStorageQuote().catch((err) => console.warn('error with updateStorageQuote', err))
    return Promise.resolve()
  }

  async getThumbnail(tabId: string): Promise<string> {
    const storageReference = ref(FirebaseServices.getStorage(), `users/${useAuthStore().user.uid}/thumbnails/${tabId}`)
    const res = await getBytes(storageReference)
    var decoder = new TextDecoder('utf-8')
    return decoder.decode(res)
  }

  async deleteThumbnail(tabId: string): Promise<void> {
    const storageReference = ref(FirebaseServices.getStorage(), `users/${useAuthStore().user.uid}/thumbnails/${tabId}`)
    await deleteObject(storageReference)
    await this.updateStorageQuote()
    return Promise.resolve()
  }

  private saveBlobToStorage(tabId: string, data: string) {
    const storageReference = ref(FirebaseServices.getStorage(), `users/${useAuthStore().user.uid}/thumbnails/${tabId}`)
    uploadString(storageReference, data).catch((err: any) => {
      console.warn('Uploaded thumbnail error', err)
    })
    return tabId
  }

  private async saveQuote(quote: object) {
    if (useAuthStore().user?.uid) {
      const userDoc = doc(FirebaseServices.getFirestore(), 'users', useAuthStore().user.uid)
      //console.log('userDoc', userDoc, useAuthStore().user?.uid)
      await setDoc(userDoc, quote, { merge: true })
    }
  }

  private async updateStorageQuote() {
    const userThumnnails = ref(FirebaseServices.getStorage(), `users/${useAuthStore().user.uid}/thumbnails`)
    const res = await listAll(userThumnnails)
    let size = 0
    for (const itemRef of res.items) {
      try {
        const md = await getMetadata(itemRef)
        size += md.size
      } catch (err) {
        // ignore, document might have been deleted
      }
    }
    //console.log('size', size)
    await this.saveQuote({ thumbnails: Math.round((100 * size) / (1024 * 1024)) / 100 })
  }
}

export default new FirestoreThumbnailsPersistence()
