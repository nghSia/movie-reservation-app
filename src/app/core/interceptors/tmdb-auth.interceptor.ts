import { HttpInterceptorFn } from '@angular/common/http';
import { _environment } from '../../../environment/environment';

export const tmdbAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(_environment.tmdb.baseUrl)) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${_environment.tmdb.token}`,
        Accept: 'application/json',
      },
      params: req.params.has('language')
        ? req.params
        : req.params.set('language', _environment.tmdb.language),
    });
  }
  return next(req);
};
