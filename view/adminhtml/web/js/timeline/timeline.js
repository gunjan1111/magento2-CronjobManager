define([
    'underscore',
    'moment',
    'uiLayout',
    'Magento_Ui/js/timeline/timeline'
], function (_, moment, layout, Timeline) {
    'use strict';
    
    // milliseconds in a day: 24 * 60 * 60 * 1000 = 86400000
    var ONE_DAY = 86400000 / (24);

    return Timeline.extend({
        defaults: {
        	dateFormat: 'YYYY-MM-DD HH:mm:ss',
            headerFormat: 'ddd MM/DD hh:mm',
            scale: 5,
            scaleStep: 1,
            minScale: 5,
            maxScale: 24,
            minHours: 24,
            displayMode: 'visualizer',
            displayModes: {
                visualizer: {
                    label: 'Visualizer',
                    value: 'visualizer',
                    template: 'cronjobManager/timeline/timeline'
                },
                grid: {
                    value: 'grid',
                    label: 'Grid',
                    template: '${ $.template }'
                }
            },
            viewConfig: {
                component: 'EthanYehuda_CronjobManager/js/timeline/timeline-view',
                name: '${ $.name }_view',
                model: '${ $.name }'
            },
            tracks: {
                scale: true
            },
            statefull: {
                scale: true
            },
            range: {}
        },

        /**
         * Initializes Timeline component.
         *
         * @returns {Timeline} Chainable.
         */
        initialize: function () {
            this._super();

            return this;
        },

        /**
         * Initializes components configuration.
         *
         * @returns {Timeline} Chainable.
         */
        initConfig: function () {
            this._super();
            delete this.displayModes['list']; // remove list component
            this.maxScale = Math.min(this.minDays, this.maxScale);
            this.minScale = Math.min(this.maxScale, this.minScale);

            return this;
        },

        /**
         * Initializes observable properties.
         *
         * @returns {Timeline} Chainable.
         */
        initObservable: function () {
            this._super()
                .observe.call(this.range, true, 'hasToday');

            return this;
        },

        /**
         * Initializes TimelineView component.
         *
         * @returns {Timeline} Chainable.
         */
        initView: function () {
            layout([this.viewConfig]);

            return this;
        },
        
        /**
         * Checks if cron ran successfully
         * 
         * @param {Object} record
         * @returns {Boolean}
         */
        isSuccess: function (record) {
        	if(!record) {
        		return false;
        	}
        	return record.status === 'success';
        },
        
        /**
         * Checks if cron failed
         * 
         * @param {Object} record
         * @returns {Boolean}
         */
        isError: function (record) {
        	if(!record) {
        		return false;
        	}
        	return record.status === 'error';
        },
        
        /**
         * Checks if cron was missed
         * 
         * @param {Object} record
         * @returns {Boolean}
         */
        isMissed: function (record) {
        	if(!record) {
        		return false;
        	}
        	return record.status === 'missed';
        },
        
        /**
         * Checks if cron is pending
         * 
         * @param {Object} record
         * @returns {Boolean}
         */
        isPending: function (record) {
        	if(!record) {
        		return false;
        	}
        	return record.status === 'pending';
        },
        
        /**
         * Checks if cron is running
         * 
         * @param {Object} record
         * @returns {Boolean}
         */
        isRunning: function (record) {
        	if(!record) {
        		return false;
        	}
        	return record.status === 'running';
        },
        
        /**
         * Checks if provided event record is active,
         * i.e. it has already started.
         *
         * @param {Object} record
         * @returns {Boolean}
         */
        isActive: function (record) {
        	if(!record) {
        		return false;
        	}
            return record.status === 'pending' || record.status === 'running';
        },

        /**
         * Checks if provided event record is permanent,
         * i.e. it has no ending time.
         *
         * @param {Object} record
         * @returns {Boolean}
         */
        isPermanent: function (record) {
            return !this.getEndDate(record);
        },

        /**
         * Checks if provided date indicates current day.
         *
         * @param {(Number|Moment)} date
         * @returns {Boolenan}
         */
        isToday: function (date) {
            return moment().isSame(date, 'day');
        },

        /**
         * Checks if range object contains todays date.
         *
         * @returns {Boolean}
         */
        hasToday: function () {
            return this.range.hasToday;
        },

        /**
         * Returns start date of provided record.
         *
         * @param {Object} record
         * @returns {String}
         */
        getStartDate: function (record) {
            return record['executed_at'] || record['scheduled_at'];
        },

        /**
         * Returns end date of provided record.
         *
         * @param {Object} record
         * @returns {String}
         */
        getEndDate: function (record) {
            return record['finished_at'];
        },

        /**
         * Returns difference in days between records' start date
         * and a first day of a range.
         *
         * @param {Object} record
         * @returns {Number}
         */
        getStartDelta: function (record) {
            var start    = this.createDate(this.getStartDate(record)),
                firstDay = this.range.firstDay;

            return start.diff(firstDay, 'hours', true);
        },
        
        /**
         * Returns the left offset for the current time
         * 
         * @returns {String}
         */
        getNowOffset: function () {
        	var unitScale = 100 / this.scale,
        		now = moment().format();
        	
        	var fakeRecord = {
        			'scheduled_at' : now
        	};
        	
        	var offset = this.getStartDelta(fakeRecord);
        	
        	return (offset * unitScale) + '%';
        	
        },

        /**
         * Calculates the amount of days that provided event lasts.
         *
         * @param {Object} record
         * @returns {Number}
         */
        getDaysLength: function (record) {
            var start   = this.createDate(this.getStartDate(record)),
                end     = this.createDate(this.getEndDate(record));

            if (!end.isValid()) {
                return 1;
            }

            return end.diff(start, 'hours', true);
        },

        /**
         * Creates new date object based on provided date string value.
         *
         * @param {String} dateStr
         * @returns {Moment}
         */
        createDate: function (dateStr) {
            return moment(dateStr, this.dateFormat);
        },

        /**
         * Converts days to weeks.
         *
         * @param {Number} days
         * @returns {Number}
         */
        daysToWeeks: function (days) {
            var weeks = days / 5;

            if (weeks % 1) {
                weeks = weeks.toFixed(1);
            }

            return weeks;
        },

        /**
         * Updates data of a range object,
         * e.g. total days, first day and last day, etc.
         *
         * @returns {Object} Range instance.
         */
        updateRange: function () {
            var firstDay    = this._getFirstDay(),
                lastDay     = this._getLastDay(),
                totalDays   = lastDay.diff(firstDay, 'hours'),
                days        = [],
                i           = -1;

            if (totalDays < this.minDays) {
                totalDays += this.minDays - totalDays - 1;
            }

            while (++i <= totalDays) {
                days.push(+firstDay + ONE_DAY * i);
            }

            return _.extend(this.range, {
                days:       days,
                totalDays:  totalDays,
                firstDay:   firstDay,
                lastDay:    moment(_.last(days)),
                hasToday:   this.isToday(firstDay)
            });
        },

        /**
         *
         * @private
         * @param {String} key
         * @param {String} fallback
         * @returns {Array<Moment>}
         */
        _getDates: function (key, fallback) {
            var dates = [];

            this.rows.forEach(function (record) {
            	var date = this.createDate(record[key]);
            	if (date.isValid()) {
                    dates.push(date);
                } else {
                	dates.push(this.createDate(record[fallback]));
                }
            }, this);

            return dates;
        },

        /**
         * Returns date which is closest to the current day.
         *
         * @private
         * @returns {Moment}
         */
        _getFirstDay: function () {
            var dates = this._getDates('executed_at', 'scheduled_at'),
                first = moment.min(dates).subtract(1, 'hour'),
                today = moment().subtract(1, 'hour');

            if (!first.isValid() || first > today) {
                first = today;
            }

            return first.startOf('hour');
        },

        /**
         * Returns the most distant date
         * specified in available records.
         *
         * @private
         * @returns {Moment}
         */
        _getLastDay: function () {
            var startDates  = this._getDates('executed_at', 'scheduled_at'),
                endDates    = this._getDates('finished_at', 'scheduled_at'),
                last        = moment.max(startDates.concat(endDates));

            return last.add(1, 'hour').startOf('hour');
        },

        /**
         * TODO: remove after integration with date binding.
         *
         * @param {Number} timestamp
         * @returns {String}
         */
        formatHeader: function (timestamp) {
            return moment(timestamp).format(this.headerFormat);
        },

        /**
         * TODO: remove after integration with date binding.
         *
         * @param {String} date
         * @returns {String}
         */
        formatDetails: function (date) {
            return moment(date).format(this.detailsFormat);
        }
    });
});
