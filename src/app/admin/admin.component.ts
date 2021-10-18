import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { DataRTDB, Data } from '../models/data.model';
import { Permission, PermissionActions, PermissionCollectionRTDB } from '../models/permission.model';
import { Profile, User } from '../models/user.model';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, OnDestroy {
  private destroyed$: Subject<boolean> = new Subject();

  private idparam: string;
  permissionForm: FormGroup;

  actions: { id: PermissionActions, name: string }[] = [
    { id: 'admin', name: 'Admin' },
    { id: 'create', name: 'Create' },
    { id: 'read', name: 'Read' },
    { id: 'update', name: 'Update' },
    { id: 'delete', name: 'Delete' }
  ];
  users: Observable<Profile[]> = null;
  item: Data = null;
  permissions: Permission[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private rtdb: AngularFireDatabase,
  ) {
    this.permissionForm = this.fb.group({
      action: ['', [Validators.required]],
      user: ['', [Validators.required]],
    });

    this.route.params.pipe(
      tap(params => {
        const { id } = params;
        this.idparam = id;
      }),
      tap(params => {
        this.users = this.rtdb.list<User>('users').valueChanges().pipe(map(list => list.map(user => user.profile)));
      }),
      tap(params => {
        const { id } = params;
        this.permissions = [];
        this.rtdb.object<PermissionCollectionRTDB>('acl/' + id).valueChanges().pipe(
          takeUntil(this.destroyed$),
          tap(permissions => this.permissions = [])
        ).subscribe(permissions => {
          console.log('permissions', permissions);

          this.actions.forEach(action => {
            if (permissions && permissions[action.id]) {
              console.log('have action', action.id, permissions[action.id], Object.values(permissions[action.id]));
              const actionPermissions = Object.values(permissions[action.id]).map(permission => ({
                ...permission,
                createdOn: new Date(permission.createdOn),
                resourceId: id,
                action: action.id,
              }));
              console.log('actionPermissions', actionPermissions);
              this.permissions = this.permissions.concat(actionPermissions);
              console.log(this.permissions);
            }
          });
        });
      }),
      switchMap(params => {
        const { id } = params;
        return this.rtdb.object<DataRTDB>('data/' + id).valueChanges().pipe(
          map(data => ({
            ...data,
            createdOn: new Date(data.createdOn),
          }))
        );
      }),
      takeUntil(this.destroyed$),
    ).subscribe(data => {
      this.item = data;
    });
  }

  ngOnInit(): void {
  }

  async remove(action: string, uid: string): Promise<void> {
    await this.rtdb.object(`/acl/${this.idparam}/${action}/${uid}`).remove();
  }

  async add(event: Event): Promise<void> {
    event.preventDefault();

    const action = this.permissionForm.get('action').value;
    const uid = this.permissionForm.get('user').value;

    await this.rtdb.object(`/acl/${this.idparam}/${action}/${uid}`).set({
      createdBy: uid,
      createdOn: firebase.default.database.ServerValue.TIMESTAMP,
      uid,
    })
  }

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

}
