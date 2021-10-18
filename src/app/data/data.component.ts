import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import * as firebase from 'firebase/app';
import { first, map } from 'rxjs/operators';
import { DataRTDB } from '../models/data.model';

@Component({
  selector: 'app-data',
  templateUrl: './data.component.html',
  styleUrls: ['./data.component.scss']
})
export class DataComponent implements OnInit {
  resources = this.db.list<DataRTDB>('data/list').valueChanges().pipe(
    map(list => list.map(item => this.db.object<DataRTDB>('data/' + item.id).valueChanges())),
  )

  constructor(
    private auth: AngularFireAuth,
    private db: AngularFireDatabase,
  ) { }

  ngOnInit(): void {
  }

  async createRecord() {
    const user = await this.auth.user.pipe(first()).toPromise()
    const dbKey = this.db.createPushId()
    await this.db.object('data/' + dbKey).set({
      id: dbKey,
      createdBy: user.uid,
      createdOn: firebase.default.database.ServerValue.TIMESTAMP
    })
    await this.db.object('data/list/' + dbKey).set({
      id: dbKey,
    })
  }

}
