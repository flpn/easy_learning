import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';

import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/map'

import { SiteService } from '../../../services/site.service';

import { ENTITIES, SCORE, PAGES } from '../../../utils/constants';

import { Question } from '../../../model/question';
import { Answer } from '../../../model/answer';
import { User } from '../../../model/user';
import { query } from '@angular/core/src/animation/dsl';
import { equal } from 'assert';

declare var $: any;

@Component({
  selector: 'app-question-detail',
  providers: [SiteService],
  templateUrl: './question-detail.component.html',
  styleUrls: ['./question-detail.component.css']
})
export class QuestionDetailComponent implements OnInit {

  currentQuestion: Question;
  show: boolean;
  answer: Answer;
  isLoading: boolean;
  answerAux: Answer;
  index: number;
  currentUser: User;
  usersLists = {}
  views: number;

  constructor(private router: ActivatedRoute, private routerPage: Router,
     private siteService: SiteService, private db: AngularFireDatabase,
      private auth: AngularFireAuth) {

        this.currentQuestion = new Question();
        this.answer = new Answer();
        this.show = false;
        this.views = this.generateRandomNumber();
  }

  ngOnInit() {
    $('.modal').modal();
    this.isLoading = true;
    this.siteService.notLogged();
    this.getKey();

    this.getUser()
    this.inicializateList();
  }

  inicializateList(){
    this.db.list(ENTITIES.user).subscribe(list => {
      list.map(user => {
        this.usersLists[user.uid] = user
      })
    })
  }

  getKey() {
    this.router.params.subscribe(params => {
      this.findQuestion(params['question-key'])
    });
  }

  findQuestion(questionKey: string) {
    this.siteService.find<Question>(ENTITIES.question, questionKey).then(question => {
      this.currentQuestion = question;
    })
  }

  createAnswer() {
    if (!this.currentQuestion.answers) {
      this.currentQuestion.answers = [];
    }

    if (this.checkUser(this.currentQuestion.user)) {
      alert('Usuário não pode responder sua própria pergunta.');
    }
    else {
        this.answer.user = this.auth.auth.currentUser.uid;
    
        this.currentQuestion.answers.push(this.answer);
        this.siteService.createAnswer(this.currentQuestion);
    
        this.answer = new Answer();
    
        this.answer.user
    }
  }

  getUserInfo(uid: string) {
    this.siteService.get(ENTITIES.user, 'uid', uid).then(user => {
      return user;
    })
  }

  setScoreQuestion(option: number) {
    if (this.checkUser(this.currentQuestion.user)) {
      alert('Usuário não pode votar na sua própria pergunta.');
    }
    else if (!this.verifyScoreUser()) {

      if (!this.currentQuestion.voteLog) {
        this.currentQuestion.voteLog = new Map<string, number>();

      }

      let userUID = this.auth.auth.currentUser.uid;
      let scoreMarked = this.currentQuestion.voteLog.get(userUID);

      if (scoreMarked) {
        if ((scoreMarked + option) <= 1 && (scoreMarked + option) >= -1) {
          this.currentQuestion.voteLog.set(userUID, (scoreMarked + option))
          this.currentQuestion.score += option;
        }
      }
      else {
        this.currentQuestion.voteLog.set(userUID, option);
        this.currentQuestion.score += option;
      }

      scoreMarked = this.currentQuestion.voteLog.get(userUID);
      console.log(scoreMarked);

      this.siteService.update<Question>(ENTITIES.question, this.currentQuestion.$key, this.currentQuestion);
    }
    else {
      //TODO trocar o alert por algo menos feio
      alert('Sua pontuação está muito baixa para avaliar uma pergunta!')
    }
  }

  setScoreAnswer(answer: Answer, option: number) {
    if (!this.verifyScoreUser()) {

      this.answerAux = this.answer;
      this.answer = answer;
      this.answer.score += option;
      this.siteService.update<Question>(ENTITIES.question, this.currentQuestion.$key, this.currentQuestion);
      this.answer = this.answerAux;

    } else {

      alert('Sua pontuação está muito baixa para avaliar uma resposta!')

    }
  }

  checkUser(userKey: string): boolean {
    return userKey === this.auth.auth.currentUser.uid
  }

  updateQuestion() {
    this.siteService.update<Question>(ENTITIES.question, this.currentQuestion.$key, this.currentQuestion)
  }

  deleteQuestion() {
    this.siteService.remove<Question>(ENTITIES.question, this.currentQuestion.$key);
    this.goToForumHome();
  }

  removeAnswer(answer: Answer) {
    var index = this.currentQuestion.answers.indexOf(answer);
    this.currentQuestion.answers.splice(index, 1);
    this.updateQuestion();
  }

  edit(answer: Answer) {
    this.index = this.currentQuestion.answers.indexOf(answer);
    if (this.show) {
      this.show = false;
    } else {
      this.show = true;
    }
  }

  updateAnswer(answer: Answer) {
    this.currentQuestion.answers[this.index] = answer;
    this.updateQuestion();
    this.show = false
  }

  bestAnswer(answer: Answer) {
    this.currentQuestion.bestAnswer = answer;
    this.updateQuestion();
  }

  hideBestAnswer(answer: Answer) {
    // return this.currentQuestion.bestAnswer !== undefined && answer.text !== this.currentQuestion.bestAnswer.text;
    if (this.currentQuestion.bestAnswer) {
      return answer.text !== this.currentQuestion.bestAnswer.text;
    }
    else {
      return true;
    }
  }

  getUser() {
    this.db.list(ENTITIES.user)
      .subscribe(list => {
        list.map(u => {
          if (this.auth.auth.currentUser.uid === u.uid) {
            this.currentUser = u;
            this.isLoading = false;    
          }
        });
      });
  }

  verifyScoreUser(): boolean {
    return this.currentUser.score <= SCORE.minimumScoreUser;
  }

  goToForumHome() {
    this.routerPage.navigate([PAGES.forumHome]);
  }

  incrementAnswer(answer: Answer){
    this.usersLists[answer.user].score += SCORE.incrementAnswer
    this.siteService.update<User>(ENTITIES.user, this.usersLists[answer.user].$key, this.usersLists[answer.user])
   
  }

  decrementAnswer(answer: Answer){
    this.usersLists[answer.user].score += SCORE.decrementAnswer
    this.siteService.update<User>(ENTITIES.user, this.usersLists[answer.user].$key, this.usersLists[answer.user])
   
  }

  generateRandomNumber() {
    return Math.floor(Math.random() * 20);
  }

  logout() {
    this.auth.auth.signOut()
      .then(() => this.routerPage.navigate([PAGES.login]));
  }
}
