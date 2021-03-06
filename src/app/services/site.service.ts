import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { AngularFireAuth } from 'angularfire2/auth'
import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2/database';

import { ENTITIES, PAGES } from '../utils/constants';

import { BaseService } from './base.service';

import { User } from '../model/user';
import { Question } from '../model/question';
import { Group } from '../model/group';

@Injectable()
export class SiteService implements OnDestroy {
    subscriptions: any[] = [];

    constructor(private router: Router, private angularFire: 
        AngularFireDatabase, private angularFireAuth :AngularFireAuth) { }

    ngOnDestroy() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    insert<T>(entity: string, obj: T):string {
      return this.angularFire.list(entity).push(obj).key;
    }

    remove<T>(entity: string, key: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            this.angularFire.list(entity).remove(key)
                .then(() => resolve())
                .catch(error => reject(error))
        });
    }

    retrieve<T>(entity: string, property: string, value: any): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            let subscription = this.angularFire.list(entity, {
                query: {
                    orderByChild: property,
                    equalTo: value
                }
                })
                .subscribe(
                    result => resolve(result),
                    error => reject(error)
                );

            this.subscriptions.push(subscription);
        })
    }

    get<T>(entity: string, property: string, value: any): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            let subscription = this.angularFire.list(entity, {
                query: {
                    orderByChild: property,
                    equalTo: value
                }
                })
                .subscribe(
                    result => resolve(result[0]),
                    error => reject(error)
                );

            this.subscriptions.push(subscription);
        })
    }

    find<T>(entity: string, key: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            let subscription = this.angularFire.object(`/${entity}/${key}`)
                .subscribe(entity => resolve(entity))

            this.subscriptions.push(subscription);
        })
    }

    update<T>(entity: string, key: string, data: any) {
        return this.angularFire.list(entity).update(key, data);
    }

    getObservable<T>(entity: string, property: string, value: any): Observable<T[]> {
        return this.angularFire.list(entity, {
            query: {
                orderByChild: property,
                equalTo: value
            }
        });
    }

    getCurrentUserEmail(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.angularFireAuth.authState.subscribe(user => {
                if (user != null) {
                    resolve(user.email);
                } else {
                    reject('user is not logged');
                }
            })
        });
    }  

   createQuestion(question: Question) {
     return this.insert<Question>(ENTITIES.question, question)
   }

   createGroup(group: Group){
    return this.insert<Group>(ENTITIES.group, group)
   }

   createAnswer(question: Question) {
     this.update<Question>(ENTITIES.question, question.$key, question);
   }
   
   notLogged() {
    this.angularFireAuth.authState.subscribe(user => {
      if(!user) {
        this.router.navigate([PAGES.login]);
      }
    }) 
   }
}  