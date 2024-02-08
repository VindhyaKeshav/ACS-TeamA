const Firestore = require("@google-cloud/firestore");
const path = require("path");

class FirestoreClient {
  constructor() {
    this.firestore = new Firestore({
      projectId: "couponsgcp",
      keyfilename: path.join(__dirname, "./service-account.json"),
      databaseId: "spotify",
    });
  }

  async save(collection, data) {
    const docRef = this.firestore.collection(collection).doc(data.name);
    await docRef.set(data);
  }

  async executeQuery(collection, query) {
    const querySnapshot = await this.firestore
      .collection(collection)
      .where(query.field, query.operator, query.value)
      .get();
    const results = [];

    querySnapshot.forEach((doc) => {
      results.push(doc.data());
    });

    return results;
  }

  async executeMultyQuery(collection, query1, query2) {
    const querySnapshot = await this.firestore
      .collection(collection)
      .where(query1.field, query1.operator, query1.value)
      .where(query2.field, query2.operator, query2.value)
      .get();
    const results = [];

    querySnapshot.forEach((doc) => {
      results.push(doc.data());
    });

    return results;
  }
}

module.exports = new FirestoreClient();
