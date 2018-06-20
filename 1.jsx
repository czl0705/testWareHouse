import React, { Component } from 'react';
import moment from 'moment';
import debounce from 'lodash.debounce';
import { Button, DatePicker, Input, Icon, Select, Modal, Checkbox, Tree, Table, message } from '@sdp.nd/fish';
const { MonthPicker, RangePicker } = DatePicker;
const Option = Select.Option;
const TreeNode = Tree.TreeNode;
const confirm = Modal.confirm;
const CheckboxGroup = Checkbox.Group;
import '../report.scss';
import logo from 'static/img/logo.png';

import {
    getDepartList,
    getSearchUsersList,
    getUserUcid,
    getAiConfigList,
    addCheckData,
    getCheckData,
    modifyCheckData,
    deleteCheckData,
    getRuleList,
    submitReview,
    getReviewList,
    getCheckReportList
} from 'service/index';

export default class ReportOperation extends Component {
    constructor(props, context) {
        super(props, context)
        this.state = {
            curDate: '',            // 当前日期
            curMonth: '',           // 当前月份
            curMonthStr: '',        // 当前年月
            beginDate: '',          // 开始日期
            endDate: '',            // 结束日期
            departName: '',         // 部门名称
            departValue: '',        // 选中的部门
            depCode: '',            // 部门id
            departDatas: [],        // 部门的所有数据
            serchDepartData: [],    // 部门搜索结果
            serchDepartName: '',    // 部门搜索名称
            treeData: [],           // 部门树
            initTreeData: [],       // 部门树-存储
            departSelectKeys: [],   // 部门选中节点
            isShow: false,          // 是否显示部门弹窗
            interviewMoth: '',      // 选择月份
            searchUserData: [],     // 选择人员数据
            userName: '',           // 选择人员的名称
            userId: '',             // 选择中人员的id
            interviewId: '',        // 面谈人ucid
            status: 2,              // 最终统计
            pageSize: 10,           // 每页的数量
            type: null,             // 是否上级操作，通常不传， =2 表示上级
            columns: [
                {
                    key: "type",
                    title: "分类",
                    dataIndex: "type",
                    render: (text, record) => (
                        <div className="cell">
                            {
                                record.type == 1 ? '部门线' : '项目线'
                            }
                        </div>
                    )
                },
                {
                    key: "interviewPeoName",
                    title: "面谈人",
                    dataIndex: "interviewPeoName"
                },
                {
                    key: "interviewPeoCode",
                    title: "面谈人工号",
                    dataIndex: "interviewPeoCode"
                },
                {
                    key: "ruleId",
                    title: "违规项",
                    dataIndex: "ruleId",
                    render: (text, record) => (
                        <div className="cell">
                            {
                                record.aiKpiInterviewRule.ruleType == 1 ? '月度考核' : (
                                    record.aiKpiInterviewRule.ruleType == 2 ? '季度考核' : '年度考核'
                                )
                            }
                        </div>
                    )
                },
                {
                    key: "kpiReallyTime",
                    title: "绩效月/季/年",
                    dataIndex: "kpiReallyTime"
                },
                {
                    key: "violationReason",
                    title: "违规原因",
                    dataIndex: "violationReason",
                    width: "300px",
                    render: (text, record) => (
                        <div className="cell">{record.aiKpiInterviewRule.ruleContent}</div>
                    )
                },
                {
                    key: "configIds",
                    title: "处罚结果",
                    dataIndex: "configIds",
                    width: "300px",
                    render: (text, record) => (
                        <div className="cell">
                            {
                                record.aiKpiConfigs.map((item, index) => {
                                    return (
                                        item.action !== 1 ? (<p key={index}>扣减{item.content}</p>) : ''
                                    )
                                })
                            }
                        </div>
                    )
                },
                {
                    key: "discussPeoName",
                    title: "被面谈人姓名",
                    dataIndex: "discussPeoName"
                },
                {
                    key: "discussPeoCode",
                    title: "被面谈人工号",
                    dataIndex: "discussPeoCode"
                },
                {
                    key: "discussTime",
                    title: "需被面谈时间",
                    dataIndex: "discussTime"
                },
                {
                    key: "kpiLastFinalTime",
                    title: "违规时间",
                    dataIndex: "kpiLastFinalTime"
                },
                {
                    key: "opertBtn",
                    title: "操作",
                    dataIndex: "opertBtn",
                    width: "100px",
                    render: (text, record, index) => (
                        <div className="cell operat-btns">
                            <Button type="font" onClick={() => this.editSelectedRuleData(index)}>修改</Button>
                            <Button type="font" onClick={() => this.deleteSelectedRuleData(index)}>删除</Button>
                        </div>
                    )
                }
            ],                      // 表格的列
            dataSource: [],         // 绩效数据
            pagination: {
                total: 0,           // 总数
                current: 1          // 当前页
            },
            ruleTitle: '',             // 违规弹窗title
            isShowRuleModal: false,     // 是否显示违规弹窗
            isUpdate: false,            // 控制更新
            isRuleDataLoading: false,   // 违规数据处理中
            violationsData: [],         // 违规项数据
            violationsContentData: [],  // 违规项数据-原因
            penaltyResultData: [],      // 处罚结果数据
            ruleMothod: 'add',          // 操作方式，add：新增，edit：修改
            ruleCheckId: '',            // 违规id
            ruleType: 1,                // 分类
            ruleTypeName: '部门线',     // 分类名称
            ruleInterviewPeoName: '',   // 面谈人名称
            ruleInterviewUserid: '',    // 面谈人id
            ruleInterviewSearchData: [],    // 面谈人搜索数据
            ruleId: '',                 // 违规项id
            ruleIdStr: '请选择违规项',              // 违规项
            ruleReason: '请选择违规原因',             // 违规项-原因
            isDisabled: true,           // 违规项是否可点击
            ruleDiscussPeoName: '',     // 被面谈人姓名
            ruleDiscussUserid: '',      // 被面谈人id
            ruleDiscussSearchData: [],  // 被面谈人搜索数据
            ruleDiscussTime: '',        // 需要被面谈时间，格式：yyyy年M月
            ruleKpiTime: '',            // 绩效对应的时间，格式：yyyy-MM-dd
            ruleKpiLastFinalTime: '',   // 绩效违规的最终时间，格式：yyyy-MM-dd
            ruleResultArr: [],          // 处罚结果选中
            ruleAiKpiConfigs: [],       // 处罚结果ID
            isReviewOver: false         // 是否确认完成
        }
        this.onSearchValue = debounce(this.onSearchValue, 500)
        this.onSearchRuleInterview = debounce(this.onSearchRuleInterview, 500)
        this.onSearchRuleDiscuss = debounce(this.onSearchRuleDiscuss, 500)
    }

    // 获取日期
    getCurrentDate() {
        const getAddressParams = (name) => {
            let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
            let r;
            if (!window.location.search) {
                let str = window.location.hash;
                let dot = str.indexOf('?') + 1;
                r = str.substr(dot).match(reg);
            } else {
                r = window.location.search.substr(1).match(reg);
            }

            if (r != null) {
                return unescape(r[2]);
            } else {
                return null;
            }
        }

        let dateParam = getAddressParams('date');
        let typeStr = getAddressParams('type');
        if (dateParam) {
            let dateStr = moment(dateParam).format('YYYY.MM.DD');
            let yearStr = moment(dateParam).format('YYYY');
            let monthStr = moment(dateParam).format('M');
            let yearMonthStr = moment(dateParam).format('YYYY-MM');
            let beginDateStr = moment(new Date(yearStr, monthStr - 1, 1)).format('YYYY-MM-DD');
            let endDateStr = moment(new Date(yearStr, monthStr, 0)).format('YYYY-MM-DD');

            this.setState({
                curDate: dateStr,
                curMonth: monthStr,
                curMonthStr: yearMonthStr,
                beginDate: beginDateStr,
                endDate: endDateStr,
                interviewMoth: yearMonthStr,
                type: typeStr && typeStr == 2 ? 2 : null
            });
        } else {
            message.error("链接参数缺失！");
        }
    }

    // 检查报告是否已经确认
    checkReportHasConfirm() {
        getReviewList(this.state.curMonthStr).then((res) => {
            let datas = res.data || JSON.parse(res.request.responseText);
            if (datas.code) {
                if (datas.data.length) {
                    let windowHref = window.location.href;
                    let startLen = windowHref.indexOf('?');
                    let endLen = windowHref.length;
                    let paramStr = windowHref.substr(startLen, endLen);
                    let jumpSrc = '/Areas/ai-manage/#/report/view' + paramStr;
                    this.setState({
                        isReviewOver: true
                    });
                    location.replace(jumpSrc);
                }
            } else {
                message.error(datas.message);
            }
        }).catch((err) => {
            console.log(err);
        });
    }

    // 切换时间
    onChangeDate(date, dateString) {
        this.setState({
            beginDate: dateString[0],
            endDate: dateString[1]
        });
    }

    // 显示部门选择弹窗
    showDepartModal() {
        let initTreeData = this.state.initTreeData;
        this.setState({
            treeData: initTreeData,
            isShow: true
        });
    }

    // 第一次加载部门数据
    firstLoadDepartData() {
        getDepartList().then((res) => {
            let datas = res.data || JSON.parse(res.request.responseText);
            if (datas.Code) {
                // 取回全部数据 - 生成一级部门
                let oneTreeData = [];
                for (let i = 0; i < datas.Data.length; i++) {
                    if (datas.Data[i].LFDepCode == 0) {
                        oneTreeData.push({
                            key: datas.Data[i].DepId,
                            name: datas.Data[i].SDepName
                        });
                    }
                }

                this.setState({
                    departDatas: datas.Data,
                    treeData: oneTreeData,
                    initTreeData: oneTreeData,
                })
            } else {
                message.error(datas.Message)
            }
        }).catch((err) => {
            console.log(err);
        });
    }

    // 异步加载
    onLoadDepartData(treeNode) {
        let departDatas = this.state.departDatas,
            temDepArr = [],
            curKey = treeNode.props.eventKey,
            tempArr = this.state.treeData;

        // 处理下级部门的逻辑
        const loop = (data, keyVal, child) => {
            data.forEach((item) => {
                if (keyVal.indexOf(item.key) === 0) {
                    if (item.children) {
                        return;
                    } else {
                        item.children = child;
                        if (!child.length) {
                            item.isLeaf = true;
                        }
                    }
                } else {
                    if (item.children) {
                        loop(item.children, keyVal, child);
                    }
                }
            });
        }

        return new Promise((resolve) => {
            setTimeout(() => {
                // 查找下级部门
                for (let i = 0; i < departDatas.length; i++) {
                    if (departDatas[i].LFDepCode == curKey) {
                        temDepArr.push({
                            key: departDatas[i].DepId,
                            name: departDatas[i].SDepName
                        });
                    }
                }

                // 处理树结构
                loop(tempArr, curKey, temDepArr);
                this.setState({
                    treeData: tempArr
                });
                resolve();
            }, 1000);
        });
    }

    // 选中树节点
    onSelectDepartTree(info, detail) {
        let name;
        if (info.length) {
            name = detail.node.props.title + "(" + info + ")";
        } else {
            name = null;
        }
        this.setState({
            departSelectKeys: info,
            departValue: name
        });
    }

    // 部门-输入框输入
    onChangeSearchDepart(value) {
        if (value.length) {
            let allData = this.state.departDatas;
            let tempArr = [];
            let n = 0;
            for (let i = 0; i < allData.length; i++) {
                if (n > 10) {
                    break;
                } else {
                    if (allData[i].SDepName.indexOf(value) !== -1) {
                        tempArr.push({
                            key: allData[i].DepId,
                            name: allData[i].SDepName
                        });
                        n++;
                    }
                }
            }
            this.setState({
                serchDepartData: tempArr
            });
        } else {
            this.setState({
                serchDepartData: [],
                serchDepartName: ''
            });
        }
        this.setState({
            serchDepartName: value
        });
    }

    // 部门-选中
    onSelectKeywordDepart(value) {
        this.setState({
            departValue: value
        });
    }

    // 部门弹窗-确定
    okSelectDepart() {
        let selectedValue = this.state.departValue;
        if (selectedValue.length) {
            let arr1 = selectedValue.split('(');
            let arr2 = arr1[1].split(")");
            let result = arr2[0]
            this.setState({
                departName: selectedValue,
                depCode: result,
                treeData: [],
                departSelectKeys: [],
                departValue: "",
                serchDepartName: "",
                isShow: false
            });
        } else {
            message.warning('请先选择部门');
        }
    }

    // 部门弹窗-取消
    cancelSelectDepart() {
        this.setState({
            serchDepartData: [],
            treeData: [],
            departSelectKeys: [],
            departValue: "",
            serchDepartName: "",
            isShow: false
        });
    }

    // 清空部门
    emptyDepart() {
        this.setState({
            departName: '',
            depCode: ''
        })
    }

    // 切换月份
    onChangeMonth(date, dateString) {
        this.setState({
            interviewMoth: dateString
        });
    }

    // 面谈人/被面谈人-输入框输入
    onChangeValue(value) {
        if (!value.length) {
            this.setState({
                searchUserData: [],
                userId: ''
            });
        }
        this.setState({
            userName: value
        });
    }

    // 面谈人/被面谈人-选中
    onSelectKeyword(value) {
        let arr1 = value.split('(');
        let name = arr1[0];
        let arr2 = arr1[1].split(')');
        let result = arr2[0];
        this.setState({
            userName: value,
            userId: result
        });
    }

    // 面谈人/被面谈人-获取数据
    onSearchValue(value) {
        if (value && value.length) {
            getSearchUsersList(value).then((res) => {
                let datas = res.data || JSON.parse(res.request.responseText);
                let tempUserArr = [];

                if (datas.Code) {
                    if (datas.Data.length) {
                        let len = datas.Data.length >= 10 ? 10 : datas.Data.length;
                        for (let i = 0; i < len; i++) {
                            getUserUcid(datas.Data[i].PersonId).then((response) => {
                                let childDatas = response.data || JSON.parse(response.request.responseText);

                                if (childDatas.code) {
                                    tempUserArr.push({
                                        key: i,
                                        userName: datas.Data[i].SPersonName,
                                        userId: childDatas.data
                                    });
                                } else {
                                    message.error(childDatas.message);
                                }
                            }).catch((error) => {
                                console.log(error);
                            });
                        }
                        let _this = this;
                        setTimeout(() => {
                            _this.setState({
                                searchUserData: tempUserArr
                            })
                        }, 1000);
                    } else {
                        this.setState({
                            searchUserData: []
                        });
                    }
                } else {
                    message.error(datas.Message);
                }
            }).catch((err) => {
                console.log(err);
            });
        }
    }

    // 搜索-按钮
    onSearch() {
        getCheckReportList(this.state.beginDate, this.state.endDate, this.state.depCode, this.state.interviewMoth, this.state.userId, this.state.status, this.state.pageSize, 1, this.state.type).then((res) => {
            let datas = res.data || JSON.parse(res.request.responseText);
            if (datas.code) {
                let tempArr = [],
                    lists = datas.data;
                if (lists.length) {
                    for (let i = 0; i < lists.length; i++) {
                        tempArr.push(lists[i]);
                        tempArr[i].key = i;
                    }
                    this.setState({
                        dataSource: tempArr,
                        pagination: {
                            current: 1,
                            total: datas.totalRecord
                        }
                    });
                } else {
                    this.setState({
                        dataSource: [],
                        pagination: {
                            total: 0,
                            current: 1
                        }
                    });
                }
            } else {
                message.error(datas.message);
            }
        }).catch((err) => {
            console.log(err)
        });
    }

    // 新增违规
    addViolation() {
        this.setState({
            ruleTitle: '新增违规',
            isShowRuleModal: true,
            ruleMothod: 'add'
        });
    }

    // 获取违规项
    getViolationsData() {
        getRuleList().then((res) => {
            let datas = res.data || JSON.parse(res.request.responseText);
            if (datas.code) {
                this.setState({
                    violationsData: datas.data
                });
            } else {
                message.error(datas.message);
            }
        }).catch((err) => {
            console.log(err);
        });
    }

    // 获取处罚结果
    getPenalyResultData() {
        getAiConfigList().then((res) => {
            let datas = res.data || JSON.parse(res.request.responseText);
            if (datas.code) {
                let list = datas.data;
                let len = list.length;
                let tempArr = [];
                if (len) {
                    for (let i = 0; i < len; i++) {
                        if (list[i].effect && list[i].action != 1) {
                            tempArr.push({
                                "value": list[i].configId,
                                "label": "扣减" + list[i].content
                            });
                        }
                    }
                    this.setState({
                        penaltyResultData: tempArr
                    });
                } else {

                }
            } else {
                message.error(datas.message);
            }
        }).catch((err) => {
            console.log(err);
        });
    }

    // 违规弹窗-选择分类
    onSelectRuleType(value) {
        this.setState({
            ruleType: parseInt(value),
            ruleTypeName: value == 1 ? "部门线" : "项目线"
        })
    }

    // 违规弹窗-面谈人-输入
    onChangeRuleInterview(value) {
        if (!value.length) {
            this.setState({
                ruleInterviewSearchData: [],
                ruleInterviewUserid: ''
            });
        }
        this.setState({
            ruleInterviewPeoName: value
        });
    }

    // 违规弹窗-面谈人-选中
    onSelectRuleInterview(value) {
        let arr1 = value.split('(');
        let name = arr1[0];
        let arr2 = arr1[1].split(')');
        let result = arr2[0];

        this.setState({
            ruleInterviewPeoName: value,
            ruleInterviewUserid: result
        });
    }

    // 违规弹窗-面谈人-获取搜索数据
    onSearchRuleInterview(value) {
        if (value && value.length) {
            getSearchUsersList(value).then((res) => {
                let datas = res.data || JSON.parse(res.request.responseText);
                let tempUserArr = [];

                if (datas.Code) {
                    if (datas.Data.length) {
                        let len = datas.Data.length >= 10 ? 10 : datas.Data.length;
                        for (let i = 0; i < len; i++) {
                            getUserUcid(datas.Data[i].PersonId).then((response) => {
                                let childDatas = response.data || JSON.parse(response.request.responseText);

                                if (childDatas.code) {
                                    tempUserArr.push({
                                        key: i,
                                        userName: datas.Data[i].SPersonName,
                                        userId: childDatas.data
                                    });
                                } else {
                                    message.error(childDatas.message);
                                }
                            }).catch((error) => {
                                console.log(error);
                            });
                        }
                        let _this = this;
                        setTimeout(() => {
                            _this.setState({
                                ruleInterviewSearchData: tempUserArr
                            })
                        }, 1000);
                    } else {
                        this.setState({
                            ruleInterviewSearchData: []
                        });
                    }
                } else {
                    message.error(datas.Message);
                }
            }).catch((err) => {
                console.log(err);
            });
        }
    }

    // 违规弹窗-违规项
    onChangeRuleViolations(value) {
        let data = this.state.violationsData;
        let len = data.length;
        let tempArr = [];
        let reason = null;
        let id = '';
        let ruleStr = '';

        for (let i = 0; i < len; i++) {
            if (value == data[i].ruleType) {
                tempArr.push(data[i]);
            }
        }
        this.setState({
            violationsContentData: tempArr
        });

        if (value !== 1) {
            for (let j = 0; j < len; j++) {
                if (value == data[j].ruleType) {
                    reason = data[j].ruleContent;
                    id = data[j].ruleId;
                }
            }
        } else {
            reason = '请选择违规原因';
            id = '';
        }

        switch (value) {
            case "1":
                ruleStr = "月度绩效";
                break;
            case "2":
                ruleStr = "季度绩效";
                break;
            case "3":
                ruleStr = "年度绩效";
                break;
        }

        this.setState({
            ruleReason: reason,
            ruleId: id ? parseInt(id) : '',
            ruleIdStr: ruleStr,
            isDisabled: false
        });
    }
    // 违规弹窗-违规项-违规原因
    onChangeRuleViolatReason(value) {
        let data = this.state.violationsContentData;
        let len = data.length;
        let reason = '';
        for (let i = 0; i < len; i++) {
            if (value == data[i].ruleId) {
                reason = data[i].ruleContent
            }
        }
        this.setState({
            ruleReason: reason,
            ruleId: parseInt(value)
        });
    }

    // 违规弹窗-处罚结果
    onChangeRuleResult(checkedValues) {
        let tempArr = [];
        let len = checkedValues.length;

        if (len) {
            for (let i = 0; i < len; i++) {
                tempArr.push({
                    "configId": checkedValues[i]
                })
            }
        } else {
            tempArr = []
        }

        this.setState({
            ruleResultArr: checkedValues,
            ruleAiKpiConfigs: tempArr
        });
    }

    // 违规弹窗-被面谈人-输入
    onChangeRuleDiscuss(value) {
        if (!value.length) {
            this.setState({
                ruleDiscussSearchData: [],
                ruleDiscussUserid: ''
            });
        }
        this.setState({
            ruleDiscussPeoName: value
        });
    }

    // 违规弹窗-被面谈人-选中
    onSelectRuleDiscuss(value) {
        let arr1 = value.split('(');
        let name = arr1[0];
        let arr2 = arr1[1].split(')');
        let result = arr2[0];

        this.setState({
            ruleDiscussPeoName: value,
            ruleDiscussUserid: result
        });
    }

    // 违规弹窗-被面谈人-获取搜索数据
    onSearchRuleDiscuss(value) {
        if (value && value.length) {
            getSearchUsersList(value).then((res) => {
                let datas = res.data || JSON.parse(res.request.responseText);
                let tempUserArr = [];

                if (datas.Code) {
                    if (datas.Data.length) {
                        let len = datas.Data.length >= 10 ? 10 : datas.Data.length;
                        for (let i = 0; i < len; i++) {
                            getUserUcid(datas.Data[i].PersonId).then((response) => {
                                let childDatas = response.data || JSON.parse(response.request.responseText);

                                if (childDatas.code) {
                                    tempUserArr.push({
                                        key: i,
                                        userName: datas.Data[i].SPersonName,
                                        userId: childDatas.data
                                    });
                                } else {
                                    message.error(childDatas.message);
                                }
                            }).catch((error) => {
                                console.log(error);
                            });
                        }
                        let _this = this;
                        setTimeout(() => {
                            _this.setState({
                                ruleDiscussSearchData: tempUserArr
                            })
                        }, 1000);
                    } else {
                        this.setState({
                            ruleDiscussSearchData: []
                        });
                    }
                } else {
                    message.error(datas.Message);
                }
            }).catch((err) => {
                console.log(err);
            });
        }
    }

    // 违规弹窗-被面谈时间
    onChangeRuleDisscuTime(date, dateString) {
        let time = dateString ? moment(dateString).format('YYYY年MM月') : '';
        this.setState({
            ruleDiscussTime: time
        });
    }

    // 违规弹窗-绩效时间
    onChangeRuleKpiTime(date, dateString) {
        this.setState({
            ruleKpiTime: dateString
        });
    }

    // 违规弹窗-违规时间
    onChangeRuleKpiLastTime(date, dateString) {
        this.setState({
            ruleKpiLastFinalTime: dateString
        });
    }

    // 违规弹窗-确定
    okSumbitRule() {
        let method = this.state.ruleMothod;
        let state = this.state;

        if (!state.ruleInterviewUserid) {
            message.error("请选择面谈人");
            return;
        }
        if (!state.ruleId) {
            message.error("请选择违规项");
            return;
        }
        if (!state.ruleAiKpiConfigs.length) {
            message.error("请选择处罚结果");
            return;
        }
        if (!state.ruleDiscussUserid) {
            message.error("请选择被面谈人");
            return;
        }
        if (!state.ruleDiscussTime) {
            message.error("请选择被面谈时间");
            return;
        }
        if (!state.ruleKpiTime) {
            message.error("请选择绩效时间");
            return;
        }
        if (!state.ruleKpiLastFinalTime) {
            message.error("请选择违规时间");
            return;
        }
        if (state.isRuleDataLoading) {
            message.warning("数据处理中，请勿操作！");
            return;
        }

        message.loading("数据处理中，请勿操作！");
        this.setState({
            isRuleDataLoading: true
        });

        let _this = this;
        if (method === 'add') {
            // 新增
            setTimeout(() => {
                addCheckData(state.ruleType, state.ruleInterviewUserid, state.ruleId, state.ruleDiscussUserid, state.ruleDiscussTime, state.ruleKpiTime, state.ruleKpiLastFinalTime, state.ruleAiKpiConfigs).then((res) => {
                    let datas = res.data || JSON.parse(res.request.responseText);
                    if (datas.code) {
                        message.success("数据处理成功！");
                        _this.setState({
                            ruleTitle: '',
                            isShowRuleModal: false,
                            isUpdate: true,
                            isRuleDataLoading: false,
                            violationsContentData: [],
                            ruleMothod: 'add',
                            ruleCheckId: '',
                            ruleType: 1,
                            ruleTypeName: '部门线',
                            ruleInterviewPeoName: '',
                            ruleInterviewUserid: '',
                            ruleInterviewSearchData: [],
                            ruleId: '',
                            ruleIdStr: '请选择违规项',
                            ruleReason: '请选择违规原因',
                            isDisabled: true,
                            ruleDiscussPeoName: '',
                            ruleDiscussUserid: '',
                            ruleDiscussTime: '',
                            ruleDiscussSearchData: [],
                            ruleKpiTime: '',
                            ruleKpiLastFinalTime: '',
                            ruleResultArr: [],
                            ruleAiKpiConfigs: []
                        });
                    } else {
                        message.error("数据处理失败！");
                        _this.setState({
                            isRuleDataLoading: false
                        });
                    }
                }).catch((err) => {
                    console.log(err);
                    message.error("数据处理失败！");
                    _this.setState({
                        isRuleDataLoading: false
                    });
                });
            }, 1500);
        } else {
            // 修改
            setTimeout(() => {
                modifyCheckData(state.ruleCheckId, state.ruleType, state.ruleInterviewUserid, state.ruleId, state.ruleDiscussUserid, state.ruleDiscussTime, state.ruleKpiTime, state.ruleKpiLastFinalTime, state.ruleAiKpiConfigs).then((res) => {
                    let datas = res.data || JSON.parse(res.request.responseText);
                    if (datas.code) {
                        message.success("数据处理成功！");
                        _this.setState({
                            ruleTitle: '',
                            isShowRuleModal: false,
                            isUpdate: true,
                            isRuleDataLoading: false,
                            violationsContentData: [],
                            ruleMothod: 'add',
                            ruleCheckId: '',
                            ruleType: 1,
                            ruleTypeName: '部门线',
                            ruleInterviewPeoName: '',
                            ruleInterviewUserid: '',
                            ruleInterviewSearchData: [],
                            ruleId: '',
                            ruleIdStr: '请选择违规项',
                            ruleReason: '请选择违规原因',
                            isDisabled: true,
                            ruleDiscussPeoName: '',
                            ruleDiscussUserid: '',
                            ruleDiscussTime: '',
                            ruleDiscussSearchData: [],
                            ruleKpiTime: '',
                            ruleKpiLastFinalTime: '',
                            ruleResultArr: [],
                            ruleAiKpiConfigs: []
                        });
                    } else {
                        message.error("数据处理失败！");
                        _this.setState({
                            isRuleDataLoading: false
                        });
                    }
                }).catch((err) => {
                    console.log(err);
                    message.error("数据处理失败！");
                    _this.setState({
                        isRuleDataLoading: false
                    });
                });
            }, 1500);
        }
    }

    // 违规弹窗-取消
    cancelSubmitRule() {
        if (this.state.isRuleDataLoading) {
            message.warning("数据处理中，请勿操作！");
            return;
        }

        this.setState({
            ruleTitle: '',
            isShowRuleModal: false,
            isUpdate: false,
            isRuleDataLoading: false,
            violationsContentData: [],
            ruleMothod: 'add',
            ruleCheckId: '',
            ruleType: 1,
            ruleTypeName: '部门线',
            ruleInterviewPeoName: '',
            ruleInterviewUserid: '',
            ruleInterviewSearchData: [],
            ruleId: '',
            ruleIdStr: '请选择违规项',
            ruleReason: '请选择违规原因',
            isDisabled: true,
            ruleDiscussPeoName: '',
            ruleDiscussUserid: '',
            ruleDiscussTime: '',
            ruleDiscussSearchData: [],
            ruleKpiTime: '',
            ruleKpiLastFinalTime: '',
            ruleResultArr: [],
            ruleAiKpiConfigs: []
        });
    }

    // 获取绩效列表
    getInterviewList(value) {
        let pageNum = value ? value : this.state.pagination.current;

        // 关闭更新
        this.setState({
            isUpdate: false
        });

        // 获取列表
        getCheckReportList(this.state.beginDate, this.state.endDate, this.state.depCode, this.state.interviewMoth, this.state.userId, this.state.status, this.state.pageSize, pageNum, this.state.type).then((res) => {
            let datas = res.data || JSON.parse(res.request.responseText);
            if (datas.code) {
                let tempArr = [];
                let lists = datas.data;
                if (lists.length) {
                    for (let i = 0; i < lists.length; i++) {
                        tempArr.push(lists[i]);
                        tempArr[i].key = i;
                    }
                    this.setState({
                        dataSource: tempArr,
                        pagination: {
                            total: datas.totalRecord
                        }
                    });
                } else {
                    this.setState({
                        dataSource: [],
                        pagination: {
                            total: 0,
                            current: 1
                        }
                    });
                }
            } else {
                message.error(datas.message);
            }
        }).catch((err) => {
            console.log(err)
        });
    }

    // 按钮-修改
    editSelectedRuleData(index) {
        let dataSource = this.state.dataSource;
        let curCheckId = dataSource[index].checkId;
        this.setState({
            ruleTitle: '修改违规',
            isShowRuleModal: true,
            ruleMothod: 'edit'
        });
        getCheckData(curCheckId).then((res) => {
            let datas = res.data || JSON.parse(res.request.responseText);
            if (datas.code) {
                let ruleObj = datas.data;
                let InterviewAllName = ruleObj.interviewPeoName + '(' + ruleObj.interviewPeoCode + ')';
                let ruleIdStr = ruleObj.aiKpiInterviewRule.ruleType == 1 ? "月度绩效" : (ruleObj.aiKpiInterviewRule.ruleType == 2 ? "季度绩效" : "年度绩效");
                let discussAllName = ruleObj.discussPeoName + '(' + ruleObj.discussPeoCode + ')';
                let aiKpiConfigsArr = ruleObj.aiKpiConfigs;
                let len = aiKpiConfigsArr.length;
                let tempRuleResultArr = [];
                let tempRuleAiKpiConfigs = [];
                let tempViolationsContentData = [];

                if (len) {
                    for (let i = 0; i < len; i++) {
                        if (aiKpiConfigsArr[i].effect && aiKpiConfigsArr[i].action != 1) {
                            tempRuleResultArr.push(aiKpiConfigsArr[i].configId);
                            tempRuleAiKpiConfigs.push({
                                "configId": aiKpiConfigsArr[i].configId
                            });
                        }
                    }
                } else {
                    tempRuleResultArr = [];
                    tempRuleAiKpiConfigs = [];
                }
                tempViolationsContentData.push({
                    ruleId: ruleObj.aiKpiInterviewRule.ruleId,
                    ruleContent: ruleObj.aiKpiInterviewRule.ruleContent
                })

                this.setState({
                    ruleCheckId: curCheckId,
                    ruleType: ruleObj.type,
                    ruleTypeName: ruleObj.type == 1 ? "部门线" : "项目线",
                    ruleInterviewPeoName: InterviewAllName,
                    ruleInterviewUserid: ruleObj.interviewPeoCode,
                    ruleId: ruleObj.ruleId,
                    ruleIdStr: ruleIdStr,
                    ruleReason: ruleObj.aiKpiInterviewRule.ruleContent,
                    isDisabled: false,
                    violationsContentData: tempViolationsContentData,
                    ruleDiscussPeoName: discussAllName,
                    ruleDiscussUserid: ruleObj.discussPeoCode,
                    ruleDiscussTime: ruleObj.discussTime,
                    ruleKpiTime: ruleObj.kpiTime,
                    ruleKpiLastFinalTime: ruleObj.kpiLastFinalTime,
                    ruleResultArr: tempRuleResultArr,
                    ruleAiKpiConfigs: tempRuleAiKpiConfigs
                });
            } else {
                message.error(datas.message);
            }
        }).catch((err) => {
            console.log(err);
        })
    }

    // 按钮-删除
    deleteSelectedRuleData(index) {
        let dataSource = this.state.dataSource;
        let checkId = dataSource[index].checkId;
        let _this = this;
        confirm({
            title: '删除后数据将不可恢复，确认删除该条违规记录吗？',
            content: '',
            onOk() {
                deleteCheckData(checkId).then((res) => {
                    let datas = res.data || JSON.parse(res.request.responseText);
                    if (datas.code) {
                        message.success("删除成功");
                        _this.setState({
                            isUpdate: true
                        });
                    } else {
                        message.error(datas.message);
                    }
                }).catch((err) => {
                    console.log(err);
                });
            },
            onCancel() { }
        });
    }

    // 分页切换
    onChangeTable(pagination) {
        this.setState({
            pagination: {
                current: pagination.current
            }
        });
    }

    // 按钮-确认无误
    onConfirmData() {
        let monthStr = this.state.curMonthStr;
        let _this = this;
        confirm({
            title: '确定后数据将入库唐钰后台，不可修改，确认将数据入库吗？',
            content: '',
            onOk() {
                message.loading("数据确认中...");
                submitReview(monthStr).then((res) => {
                    let datas = res.data || JSON.parse(res.request.responseText);
                    if (datas.code) {
                        message.success("确认成功");
                        _this.setState({
                            isReviewOver: true
                        });

                        let windowHref = window.location.href;
                        let startLen = windowHref.indexOf('?');
                        let endLen = windowHref.length;
                        let paramStr = windowHref.substr(startLen, endLen);
                        let jumpSrc = '/Areas/ai-manage/#/report/view' + paramStr;
                        setTimeout(() => {
                            location.replace(jumpSrc);
                        }, 1800);
                    } else {
                        message.error(datas.message);
                    }
                }).catch((err) => {
                    console.log(err);
                });
            },
            onCancel() { }
        });
    }

    componentWillMount() {
        this.getCurrentDate();
        this.firstLoadDepartData();
        this.getViolationsData();
        this.getPenalyResultData();
    }

    componentDidMount() {
        this.checkReportHasConfirm();
        this.getInterviewList();
    }

    componentWillUpdate(nextProps, nextState) {
        // 更新列表 - 页面切换
        if (this.state.pagination.current !== nextState.pagination.current && nextState.pagination.current) {
            this.getInterviewList(nextState.pagination.current);
        }

        // 更新列表 - 字段开关
        if (nextState.isUpdate) {
            this.getInterviewList(1);
        }
    }

    render() {
        const userData = this.state.searchUserData;
        const departData = this.state.serchDepartData;
        const violationsContentData = this.state.violationsContentData;
        const penaltyResultData = this.state.penaltyResultData;
        const interviewSearchData = this.state.ruleInterviewSearchData;
        const discussSerachData = this.state.ruleDiscussSearchData;

        // 部门树
        const loop = data => data.map((item) => {
            if (item.children && item.children.length) {
                return <TreeNode title={item.name} key={item.key}>{loop(item.children)}</TreeNode>;
            }
            return <TreeNode title={item.name} key={item.key} isLeaf={item.isLeaf} />;
        });
        const treeNodes = loop(this.state.treeData);

        // 部门 - 清空按钮
        const suffix = this.state.departName ? <Icon type="cross-circle-o" onClick={() => this.emptyDepart()} /> : null;

        return (
            <div className="report-page">
                <div className="report-content">
                    <div className="report-main">
                        <div className="report-top">
                            <div className="wrapper">
                                <h1 className="logo">
                                    <a href="javascript:;" title="">
                                        <img src={logo} alt="" />
                                    </a>
                                </h1>
                                <div className="title">
                                    <h2 className="tit">{this.state.curMonth}月份绩效检查报告</h2>
                                    <p className="time">{this.state.curDate}</p>
                                </div>
                            </div>
                        </div>
                        <div className="report-middle">
                            <div className="wrapper">
                                <div className="main-oper-block clearfix">
                                    <div className="date-range-area fl">
                                        <RangePicker defaultValue={[moment(this.state.beginDate, 'YYYY-MM-DD'), moment(this.state.endDate, 'YYYY-MM-DD')]} onChange={(date, dateString) => this.onChangeDate(date, dateString)} />
                                    </div>
                                    <div className="select-area select-depart fl">
                                        <Input className="depart-input-box" placeholder="请选择部门" value={this.state.departName} onClick={() => this.showDepartModal()} suffix={suffix} readOnly />
                                        <Modal title="部门选择" visible={this.state.isShow} onOk={() => this.okSelectDepart()} onCancel={() => this.cancelSelectDepart()}>
                                            <div className="depart-tree-cont">
                                                <div className="search-depart-wrap">
                                                    <Select
                                                        combobox
                                                        value={this.state.serchDepartName}
                                                        placeholder="输入部门名称进行搜索"
                                                        defaultActiveFirstOption={false}
                                                        showArrow={false}
                                                        filterOption={false}
                                                        onChange={(value) => this.onChangeSearchDepart(value)}
                                                        onSelect={(value) => this.onSelectKeywordDepart(value)}
                                                    >
                                                        {
                                                            departData.map(d => <Option key={d.name + '(' + d.key + ')'}>{d.name + '(' + d.key + ')'}</Option>)
                                                        }
                                                    </Select>
                                                </div>
                                                <Tree selectedKeys={this.state.departSelectKeys} onSelect={(info, detail) => this.onSelectDepartTree(info, detail)} loadData={(treeNode) => this.onLoadDepartData(treeNode)}>
                                                    {treeNodes}
                                                </Tree>
                                            </div>
                                        </Modal>
                                    </div>
                                    <div className="select-area select-month fl">
                                        <MonthPicker placeholder="请选择需被面谈时间" value={this.state.interviewMoth ? moment(this.state.interviewMoth, 'YYYY-MM') : null} onChange={(date, dateString) => this.onChangeMonth(date, dateString)} />
                                    </div>
                                    <div className="search-area fl">
                                        <Select
                                            combobox
                                            value={this.state.userName}
                                            placeholder="输入面谈人名称/被面谈人名称/工号进行搜索"
                                            defaultActiveFirstOption={false}
                                            showArrow={false}
                                            filterOption={false}
                                            onChange={(value) => this.onChangeValue(value)}
                                            onSearch={(value) => this.onSearchValue(value)}
                                            onSelect={(value) => this.onSelectKeyword(value)}
                                        >
                                            {
                                                userData.map(d => <Option key={d.userName + '(' + d.userId + ')'}>{d.userName + '(' + d.userId + ')'}</Option>)
                                            }
                                        </Select>
                                    </div>
                                    <div className="button-area fl">
                                        <Button type="primary" size="large" onClick={() => this.onSearch()}>搜索</Button>
                                    </div>
                                    <div className="button-area last-area-item fr">
                                        <Button type="primary" size="large" onClick={() => this.addViolation()}>新增违规</Button>
                                    </div>
                                </div>
                                <div className="table-block">
                                    <Table columns={this.state.columns} dataSource={this.state.dataSource} pagination={this.state.pagination} onChange={(pagination) => this.onChangeTable(pagination)} bordered />
                                </div>
                                <div className="btns-block">
                                    <Button type="primary" size="large" onClick={() => this.onConfirmData()} disabled={this.state.isReviewOver}>确认无误</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="report-footer">NETDRAGON WEBSOFT INC.</div>
                <Modal title={this.state.ruleTitle} visible={this.state.isShowRuleModal} width="800px" onOk={() => this.okSumbitRule()} onCancel={() => this.cancelSubmitRule()}>
                    <div className="modal-rule-cont">
                        <div className="report-form-block">
                            <div className="form-item">
                                <div className="form-label">
                                    <em className="red">*</em>分类
                                </div>
                                <div className="form-area">
                                    <div className="form-area-row">
                                        <Select value={this.state.ruleTypeName} onSelect={(value) => this.onSelectRuleType(value)}>
                                            <Option key="1">部门线</Option>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <div className="form-item">
                                <div className="form-label">
                                    <em className="red">*</em>面谈人
                                </div>
                                <div className="form-area">
                                    <div className="form-area-row">
                                        <Select
                                            combobox
                                            value={this.state.ruleInterviewPeoName}
                                            placeholder="请选择面谈人"
                                            defaultActiveFirstOption={false}
                                            showArrow={false}
                                            filterOption={false}
                                            onChange={(value) => this.onChangeRuleInterview(value)}
                                            onSearch={(value) => this.onSearchRuleInterview(value)}
                                            onSelect={(value) => this.onSelectRuleInterview(value)}
                                        >
                                            {
                                                interviewSearchData.map(d => <Option key={d.userName + '(' + d.userId + ')'}>{d.userName + '(' + d.userId + ')'}</Option>)
                                            }
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <div className="form-item">
                                <div className="form-label">
                                    <em className="red">*</em>违规项
                                </div>
                                <div className="form-area">
                                    <div className="form-area-row">
                                        <Select placeholder="请选择违规项" value={this.state.ruleIdStr} onChange={(value) => this.onChangeRuleViolations(value)}>
                                            <Option key="1">月度绩效</Option>
                                            <Option key="2">季度绩效</Option>
                                            <Option key="3">年度绩效</Option>
                                        </Select>
                                    </div>
                                    <div className="form-area-row">
                                        <Select placeholder="请选择违规原因" value={this.state.ruleReason} disabled={this.state.isDisabled} onChange={(value) => this.onChangeRuleViolatReason(value)}>
                                            {
                                                violationsContentData.length ? (
                                                    violationsContentData.map(d => <Option key={d.ruleId}>{d.ruleContent}</Option>)
                                                ) : ""
                                            }
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <div className="form-item">
                                <div className="form-label">
                                    <em className="red">*</em>处罚结果
                                </div>
                                <div className="form-area">
                                    <div className="form-area-col">
                                        {
                                            penaltyResultData.length ? (
                                                <CheckboxGroup options={penaltyResultData} value={this.state.ruleResultArr} onChange={(checkedValues) => this.onChangeRuleResult(checkedValues)} />
                                            ) : (
                                                    <Checkbox disabled>暂无数据</Checkbox>
                                                )
                                        }
                                    </div>
                                </div>
                            </div>
                            <div className="form-item">
                                <div className="form-label">
                                    <em className="red">*</em>需要被面谈人
                                </div>
                                <div className="form-area">
                                    <div className="form-area-row">
                                        <Select
                                            combobox
                                            value={this.state.ruleDiscussPeoName}
                                            placeholder="请选择未被面谈人"
                                            defaultActiveFirstOption={false}
                                            showArrow={false}
                                            filterOption={false}
                                            onChange={(value) => this.onChangeRuleDiscuss(value)}
                                            onSearch={(value) => this.onSearchRuleDiscuss(value)}
                                            onSelect={(value) => this.onSelectRuleDiscuss(value)}
                                        >
                                            {
                                                discussSerachData.map(d => <Option key={d.userName + '(' + d.userId + ')'}>{d.userName + '(' + d.userId + ')'}</Option>)
                                            }
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <div className="form-item">
                                <div className="form-label">
                                    <em className="red">*</em>需被面谈时间
                                </div>
                                <div className="form-area">
                                    <div className="form-area-row">
                                        <MonthPicker placeholder="请选择需被面谈时间" value={this.state.ruleDiscussTime ? moment(this.state.ruleDiscussTime, 'YYYY-MM') : null} onChange={(date, dateString) => this.onChangeRuleDisscuTime(date, dateString)} />
                                    </div>
                                </div>
                            </div>
                            <div className="form-item">
                                <div className="form-label">
                                    <em className="red">*</em>绩效月/季/年
                                </div>
                                <div className="form-area">
                                    <div className="form-area-row">
                                        <MonthPicker placeholder="请选择绩效月/季/年" value={this.state.ruleKpiTime ? moment(this.state.ruleKpiTime, 'YYYY-MM') : null} onChange={(date, dateString) => this.onChangeRuleKpiTime(date, dateString)} />
                                    </div>
                                </div>
                            </div>
                            <div className="form-item">
                                <div className="form-label">
                                    <em className="red">*</em>违规时间
                                </div>
                                <div className="form-area">
                                    <div className="form-area-row">
                                        <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" placeholder="请选择日期" value={this.state.ruleKpiLastFinalTime ? (
                                            moment(this.state.ruleKpiLastFinalTime, 'YYYY-MM-DD HH:mm:ss')
                                        ) : null} onChange={(date, dateString) => this.onChangeRuleKpiLastTime(date, dateString)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            </div>
        )
    }
}