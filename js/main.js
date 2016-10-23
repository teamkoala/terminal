; (function ($, window, undefined) {

    /**
     * Sets up our control over the DOM
     */
    var DOMController = function () {
        var self = this; 

        this.order = $('#order');
        this.payButton = $('#pay-button');
        this.overlay = $('#overlay');

        this.payButton.mousedown(function(){
            self.makeTransaction();
        });


        this.poller = new Poller();
        this.poller.onupdate = this.update.bind(this);
    

        tetra.weblet.on('hide', function () {
            if (self.poller.getTimerID()) {
                window.clearTimeout(self.poller.getTimerID());
                self.overlay.removeClass('hidden');
            }
        });

        tetra.weblet.on('show', function () {
            if (self.poller.getTimerID()) {
                self.poller.resume();
            }
        });
    }


    DOMController.prototype.makeTransaction = function(){
        var self = this;
        var total = this.poller.getOrderTotal();
        var transaction = new Transaction(total);
        transaction.make();
        this.overlay.toggleClass('hidden');
        window.clearTimeout(self.poller.getTimerID());
        resetTransactions().then(function(){
            self.poller = new Poller();
            self.poller.onupdate = self.update.bind(self);

        });

    }

    DOMController.prototype.update = function(order){
        
        var self = this;
        if(order.finished){
            this.makeTransaction();
            return;
        }   
        this.order.empty();
        $.each(order.line_items, function( index, value ) {
            self.addLineItem(value.line_item)
        });
        
        
        this.overlay.addClass('hidden');

    }

    DOMController.prototype.addLineItem = function(item){
        this.current
        this.order.append('<tr><td class="description">' + item.pretty_name + '</td><td class="price">$' + (item.price/100).toFixed( 2 ) + '</td></tr>');
    }

    


    $(function () {
        resetTransactions().then(function(){
            window.setTimeout(function(){
                new DOMController();
            }, 15000)
        })
        
        
    });

})(jQuery, window, null);

function Poller(){

    var self = this;

    ORDERS_ENDPOINT = 'https://rocky-sands-79934.herokuapp.com/orders.json';
    POLL_TIME = 5 /* Seconds */ * 1000 /* MS */;

    this.items = [];
    this.currentOrder = null;

    self.poll();
    
}

/**
 * TODO:
 * Move poller to another file
 */

Poller.prototype.poll = function(){
 $.get(ORDERS_ENDPOINT, this.process_.bind(this));
 this.timerId = null;
}

Poller.prototype.getOrderTotal = function(){

    var total = 0;
    for(var index = 0; index < this.currentOrder.line_items.length; index++){
        total += this.currentOrder.line_items[index].line_item.price;
    }

    return total;
}

Poller.prototype.process_ = function(data){
    console.log(data);
    var self = this;

    var last = data ? data.orders[data.orders.length -1] : null;

    var isNoOrder = !this.currentOrder  && data.orders.length > 0;
    var isNewOrder = this.currentOrder && last && this.currentOrder.id !== last.id;
    var isStateChanged = this.currentOrder && last && this.currentOrder.state !== last.state;
    var isItemsChanged = this.currentOrder && last && this.currentOrder.line_items.length !== last.line_items.length;
    var isOrderFinished = this.currentOrder && last.finished;

    if(isNoOrder || isNewOrder || isStateChanged || isItemsChanged || isOrderFinished) {
        this.currentOrder = last;
        this.onupdate(this.currentOrder);
    }   

    this.timerId = window.setTimeout(function(){
        self.poll();
    }, POLL_TIME); 
}

Poller.prototype.resume = function(){
    
    var self = this;
    
    this.timerId = window.setTimeout(function(){
        self.poll();
    }, POLL_TIME); 
}

Poller.prototype.getTimerID = function(){
    return this.timerId;
}

/** Overwrite this method */
Poller.prototype.onupdate = function (order) {
    console.log('Updating', this.currentOrder);
}

function resetTransactions() {
    return new Promise(function (resolve) {
        $.ajax({
            url: 'https://rocky-sands-79934.herokuapp.com/orders/destroy/',
            type: 'DELETE',
            success: function (result) {
                resolve();
            }
        });
    });
};